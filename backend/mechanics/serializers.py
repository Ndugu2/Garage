from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework import serializers

from .models import AssistanceRequest, Mechanic, RequestMessage, Review, UserProfile

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ["role"]


class AccountSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    name = serializers.SerializerMethodField()
    provider_profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "name", "profile", "provider_profile"]

    def get_name(self, user):
        return user.get_full_name() or user.email

    def get_provider_profile(self, user):
        try:
            provider = user.profile.provider_profile
        except (UserProfile.DoesNotExist, Mechanic.DoesNotExist):
            return None
        return {
            "id": provider.id,
            "name": provider.name,
            "area": provider.area,
            "service_mode": provider.service_mode,
            "is_available": provider.is_available,
            "is_verified": provider.is_verified,
        }


class RegistrationSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    role = serializers.ChoiceField(choices=UserProfile.Role.choices)

    def validate_email(self, value):
        normalized_email = value.strip().lower()
        if User.objects.filter(email__iexact=normalized_email).exists() or User.objects.filter(
            username__iexact=normalized_email
        ).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return normalized_email

    def validate(self, attrs):
        name_parts = attrs["name"].strip().split(maxsplit=1)
        candidate_user = User(
            username=attrs["email"],
            email=attrs["email"],
            first_name=name_parts[0],
            last_name=name_parts[1] if len(name_parts) > 1 else "",
        )
        try:
            validate_password(attrs["password"], user=candidate_user)
        except DjangoValidationError as error:
            raise serializers.ValidationError({"password": list(error.messages)}) from error
        attrs["name"] = " ".join(name_parts)
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        name_parts = validated_data["name"].split(maxsplit=1)
        user = User.objects.create_user(
            username=validated_data["email"],
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=name_parts[0],
            last_name=name_parts[1] if len(name_parts) > 1 else "",
        )
        UserProfile.objects.create(user=user, role=validated_data["role"])
        return user


class MechanicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mechanic
        fields = [
            "id",
            "name",
            "area",
            "latitude",
            "longitude",
            "rating",
            "review_count",
            "eta",
            "is_available",
            "services",
            "is_demo",
            "is_verified",
            "service_mode",
        ]


class MechanicProfileSerializer(serializers.ModelSerializer):
    services = serializers.ListField(
        child=serializers.ChoiceField(choices=Mechanic.Service.choices),
        allow_empty=False,
    )

    class Meta:
        model = Mechanic
        fields = [
            "id",
            "name",
            "area",
            "latitude",
            "longitude",
            "service_mode",
            "phone",
            "services",
            "eta",
            "is_available",
            "is_verified",
            "is_demo",
            "rating",
            "review_count",
        ]
        read_only_fields = [
            "id",
            "is_verified",
            "is_demo",
            "rating",
            "review_count",
        ]

    def validate(self, attrs):
        latitude = attrs.get("latitude", getattr(self.instance, "latitude", None))
        longitude = attrs.get("longitude", getattr(self.instance, "longitude", None))
        if latitude is not None and not -90 <= latitude <= 90:
            raise serializers.ValidationError({"latitude": "Latitude must be from -90 to 90."})
        if longitude is not None and not -180 <= longitude <= 180:
            raise serializers.ValidationError(
                {"longitude": "Longitude must be from -180 to 180."}
            )
        return attrs


class AssistanceRequestSerializer(serializers.ModelSerializer):
    mechanic_name = serializers.CharField(source="mechanic.name", read_only=True)
    driver_name = serializers.SerializerMethodField()
    has_review = serializers.SerializerMethodField()

    class Meta:
        model = AssistanceRequest
        fields = [
            "id",
            "mechanic",
            "mechanic_name",
            "driver_name",
            "driver",
            "issue",
            "notes",
            "latitude",
            "longitude",
            "service_mode",
            "status",
            "has_review",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "mechanic_name",
            "driver_name",
            "driver",
            "service_mode",
            "status",
            "has_review",
            "created_at",
            "updated_at",
        ]

    def get_driver_name(self, request):
        return request.driver.get_full_name() or request.driver.email

    def get_has_review(self, request):
        return hasattr(request, "review")


class AssistanceRequestCreateSerializer(serializers.ModelSerializer):
    mechanic = serializers.PrimaryKeyRelatedField(queryset=Mechanic.objects.all())

    class Meta:
        model = AssistanceRequest
        fields = ["mechanic", "issue", "notes", "latitude", "longitude"]

    def validate_issue(self, value):
        allowed = [choice.value for choice in Mechanic.Service]
        if value != "Other" and value not in allowed:
            raise serializers.ValidationError("Select a supported vehicle problem.")
        return value

    def validate(self, attrs):
        mechanic = attrs["mechanic"]
        if mechanic.is_demo or not mechanic.is_verified:
            raise serializers.ValidationError(
                {"mechanic": "Requests can only be sent to a verified mechanic."}
            )
        if not mechanic.is_available:
            raise serializers.ValidationError(
                {"mechanic": "This mechanic is not currently accepting requests."}
            )
        if attrs["issue"] != "Other" and attrs["issue"] not in mechanic.services:
            raise serializers.ValidationError(
                {"issue": "This mechanic does not list the selected service."}
            )
        if not -90 <= attrs["latitude"] <= 90:
            raise serializers.ValidationError(
                {"latitude": "Latitude must be from -90 to 90."}
            )
        if not -180 <= attrs["longitude"] <= 180:
            raise serializers.ValidationError(
                {"longitude": "Longitude must be from -180 to 180."}
            )
        return attrs


class RequestMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()

    class Meta:
        model = RequestMessage
        fields = ["id", "sender", "sender_name", "message", "created_at"]
        read_only_fields = ["id", "sender", "sender_name", "created_at"]

    def get_sender_name(self, message):
        return message.sender.get_full_name() or message.sender.email


class ReviewSerializer(serializers.ModelSerializer):
    driver_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ["id", "request", "driver", "driver_name", "rating", "comment", "created_at"]
        read_only_fields = ["id", "request", "driver", "driver_name", "created_at"]

    def get_driver_name(self, review):
        return review.driver.get_full_name() or review.driver.email
