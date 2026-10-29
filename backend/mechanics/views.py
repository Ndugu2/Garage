from math import atan2, cos, radians, sin, sqrt

from django.contrib.auth import authenticate, login, logout
from django.db import transaction
from django.db.models import Avg, Count, Q
from django.middleware.csrf import get_token
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AssistanceRequest, Mechanic, RequestMessage, Review, UserProfile
from .serializers import (
    AccountSerializer,
    AssistanceRequestCreateSerializer,
    AssistanceRequestSerializer,
    MechanicProfileSerializer,
    MechanicSerializer,
    RegistrationSerializer,
    RequestMessageSerializer,
    ReviewSerializer,
)


class CsrfSessionAuthentication(SessionAuthentication):
    def authenticate(self, request):
        self.enforce_csrf(request)
        return super().authenticate(request)


class CsrfTokenView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({"csrfToken": get_token(request)})


class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [CsrfSessionAuthentication]

    def post(self, request):
        serializer = RegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        login(request, user)
        return Response(
            {"user": AccountSerializer(user).data, "csrfToken": get_token(request)},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [CsrfSessionAuthentication]

    def post(self, request):
        email = request.data.get("email", "")
        password = request.data.get("password", "")
        if not isinstance(email, str) or not isinstance(password, str):
            raise ValidationError({"detail": "Enter a valid email and password."})

        user = authenticate(request, username=email.strip().lower(), password=password)
        if user is None:
            raise ValidationError({"detail": "Email or password is incorrect."})
        if not hasattr(user, "profile"):
            raise ValidationError({"detail": "This account needs a profile before it can sign in."})

        login(request, user)
        return Response(
            {"user": AccountSerializer(user).data, "csrfToken": get_token(request)}
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CsrfSessionAuthentication]

    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class CurrentAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, "profile"):
            raise ValidationError({"detail": "This account needs a profile before it can be used."})
        return Response(AccountSerializer(request.user).data)


def get_user_profile(user):
    try:
        return user.profile
    except UserProfile.DoesNotExist as error:
        raise PermissionDenied("Your account profile is not configured.") from error


def require_role(user, role):
    profile = get_user_profile(user)
    if profile.role != role:
        raise PermissionDenied(f"A {role} account is required for this action.")
    return profile


class MechanicProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = require_role(request.user, UserProfile.Role.MECHANIC)
        try:
            mechanic = profile.provider_profile
        except Mechanic.DoesNotExist:
            return Response(None)
        return Response(MechanicProfileSerializer(mechanic).data)

    def post(self, request):
        profile = require_role(request.user, UserProfile.Role.MECHANIC)
        if Mechanic.objects.filter(user_profile=profile).exists():
            raise ValidationError({"detail": "A provider profile already exists."})
        serializer = MechanicProfileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        mechanic = serializer.save(user_profile=profile, is_demo=False)
        return Response(
            MechanicProfileSerializer(mechanic).data,
            status=status.HTTP_201_CREATED,
        )

    def patch(self, request):
        profile = require_role(request.user, UserProfile.Role.MECHANIC)
        mechanic = get_object_or_404(Mechanic, user_profile=profile)
        serializer = MechanicProfileSerializer(
            mechanic,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        mechanic = serializer.save()
        return Response(MechanicProfileSerializer(mechanic).data)


def distance_km(latitude, longitude, mechanic):
    earth_radius_km = 6371
    latitude_delta = radians(mechanic.latitude - latitude)
    longitude_delta = radians(mechanic.longitude - longitude)
    haversine = (
        sin(latitude_delta / 2) ** 2
        + cos(radians(latitude))
        * cos(radians(mechanic.latitude))
        * sin(longitude_delta / 2) ** 2
    )
    bounded_haversine = min(1, max(0, haversine))
    return earth_radius_km * 2 * atan2(
        sqrt(bounded_haversine),
        sqrt(1 - bounded_haversine),
    )


class HealthView(APIView):
    def get(self, request):
        return Response({"status": "ok", "service": "Makanika Connect API"})


class MechanicListView(APIView):
    def get(self, request):
        mechanics = Mechanic.objects.filter(Q(is_demo=True) | Q(is_verified=True))
        service = request.query_params.get("service")
        available_only = request.query_params.get("available") == "true"
        latitude = request.query_params.get("latitude")
        longitude = request.query_params.get("longitude")
        radius = request.query_params.get("radius", "30")

        if service:
            mechanics = [
                mechanic
                for mechanic in mechanics
                if service in mechanic.services
            ]
        if available_only:
            mechanics = [
                mechanic for mechanic in mechanics if mechanic.is_available
            ]

        if latitude is None and longitude is None:
            return Response(MechanicSerializer(mechanics, many=True).data)
        if latitude is None or longitude is None:
            raise ValidationError(
                {"location": "Provide both latitude and longitude."}
            )

        try:
            driver_latitude = float(latitude)
            driver_longitude = float(longitude)
            search_radius = float(radius)
        except ValueError as error:
            raise ValidationError(
                {"location": "Coordinates and radius must be numbers."}
            ) from error

        if not -90 <= driver_latitude <= 90:
            raise ValidationError({"latitude": "Latitude must be from -90 to 90."})
        if not -180 <= driver_longitude <= 180:
            raise ValidationError(
                {"longitude": "Longitude must be from -180 to 180."}
            )
        if not 0 < search_radius <= 500:
            raise ValidationError({"radius": "Radius must be between 0 and 500 km."})

        nearby = [
            (mechanic, distance_km(driver_latitude, driver_longitude, mechanic))
            for mechanic in mechanics
        ]
        nearby = [
            (mechanic, distance)
            for mechanic, distance in nearby
            if distance <= search_radius
        ]
        nearby.sort(key=lambda item: item[1])

        results = MechanicSerializer(
            [mechanic for mechanic, _distance in nearby],
            many=True,
        ).data
        for result, (_mechanic, distance) in zip(results, nearby):
            result["distance_km"] = round(distance, 1)

        return Response(results)


class AssistanceRequestListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = get_user_profile(request.user)
        requests = AssistanceRequest.objects.select_related("mechanic", "driver")
        if profile.role == UserProfile.Role.DRIVER:
            requests = requests.filter(driver=request.user)
        else:
            requests = requests.filter(mechanic__user_profile=profile)
        return Response(AssistanceRequestSerializer(requests, many=True).data)

    def post(self, request):
        require_role(request.user, UserProfile.Role.DRIVER)
        serializer = AssistanceRequestCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        mechanic = serializer.validated_data["mechanic"]
        assistance_request = serializer.save(
            driver=request.user,
            service_mode=mechanic.service_mode,
        )
        return Response(
            AssistanceRequestSerializer(assistance_request).data,
            status=status.HTTP_201_CREATED,
        )


class AssistanceRequestStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        profile = require_role(request.user, UserProfile.Role.MECHANIC)
        assistance_request = get_object_or_404(
            AssistanceRequest.objects.select_related("mechanic"),
            pk=pk,
            mechanic__user_profile=profile,
        )
        next_status = request.data.get("status")
        valid_transitions = {
            AssistanceRequest.Status.PENDING: {
                AssistanceRequest.Status.ACCEPTED,
                AssistanceRequest.Status.REJECTED,
            },
            AssistanceRequest.Status.ACCEPTED: {
                AssistanceRequest.Status.COMPLETED,
            },
        }
        if next_status not in valid_transitions.get(assistance_request.status, set()):
            raise ValidationError({"status": "This request status transition is not allowed."})
        assistance_request.status = next_status
        assistance_request.save(update_fields=["status", "updated_at"])
        return Response(AssistanceRequestSerializer(assistance_request).data)


def get_request_for_participant(request, pk):
    profile = get_user_profile(request.user)
    assistance_request = get_object_or_404(
        AssistanceRequest.objects.select_related("mechanic", "driver"),
        pk=pk,
    )
    is_driver = (
        profile.role == UserProfile.Role.DRIVER
        and assistance_request.driver_id == request.user.id
    )
    is_mechanic = (
        profile.role == UserProfile.Role.MECHANIC
        and assistance_request.mechanic.user_profile_id == profile.id
    )
    if not (is_driver or is_mechanic):
        raise PermissionDenied("Only the driver and assigned mechanic can access this request.")
    return assistance_request


class RequestMessageListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        assistance_request = get_request_for_participant(request, pk)
        messages = assistance_request.messages.select_related("sender").all()
        return Response(RequestMessageSerializer(messages, many=True).data)

    def post(self, request, pk):
        assistance_request = get_request_for_participant(request, pk)
        if assistance_request.status == AssistanceRequest.Status.REJECTED:
            raise ValidationError({"detail": "Messaging is unavailable for a rejected request."})
        serializer = RequestMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        message = serializer.save(request=assistance_request, sender=request.user)
        return Response(
            RequestMessageSerializer(message).data,
            status=status.HTTP_201_CREATED,
        )


class RequestReviewCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        require_role(request.user, UserProfile.Role.DRIVER)
        assistance_request = get_object_or_404(
            AssistanceRequest.objects.select_related("mechanic"),
            pk=pk,
            driver=request.user,
        )
        if assistance_request.status != AssistanceRequest.Status.COMPLETED:
            raise ValidationError({"detail": "You can review a mechanic after the request is completed."})
        if hasattr(assistance_request, "review"):
            raise ValidationError({"detail": "This completed request already has a review."})
        serializer = ReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = serializer.save(
            request=assistance_request,
            driver=request.user,
            mechanic=assistance_request.mechanic,
        )
        aggregate = Review.objects.filter(mechanic=assistance_request.mechanic).aggregate(
            average_rating=Avg("rating"),
            review_count=Count("id"),
        )
        mechanic = assistance_request.mechanic
        mechanic.rating = aggregate["average_rating"] or 0
        mechanic.review_count = aggregate["review_count"] or 0
        mechanic.save(update_fields=["rating", "review_count"])
        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)


class MechanicReviewListView(APIView):
    def get(self, request, pk):
        mechanic = get_object_or_404(
            Mechanic.objects.filter(Q(is_demo=True) | Q(is_verified=True)),
            pk=pk,
        )
        reviews = mechanic.reviews.select_related("driver").all()
        return Response(ReviewSerializer(reviews, many=True).data)
