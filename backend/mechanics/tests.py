from django.contrib.auth import get_user_model
from rest_framework.test import APIClient, APITestCase

from .models import AssistanceRequest, Mechanic, UserProfile


class MechanicApiTests(APITestCase):
    password = "Kampala!Roadside2026"

    def setUp(self):
        self.nearby = Mechanic.objects.create(
            name="Ntinda Mobile Mechanic",
            area="Ntinda",
            latitude=0.3574,
            longitude=32.6131,
            rating=4.8,
            review_count=32,
            eta="About 20 min",
            services=["Tyre change", "Battery"],
        )
        Mechanic.objects.create(
            name="Wandegeya Mechanic",
            area="Wandegeya",
            latitude=0.3355,
            longitude=32.5681,
            services=["Engine"],
        )

    def test_mechanics_are_sorted_by_distance(self):
        response = self.client.get(
            "/api/mechanics/",
            {"latitude": "0.357", "longitude": "32.613", "radius": "2"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.nearby.id)
        self.assertEqual(response.data[0]["distance_km"], 0.0)

    def test_service_and_availability_filters(self):
        response = self.client.get(
            "/api/mechanics/",
            {"service": "Battery", "available": "true"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["id"] for item in response.data], [self.nearby.id])

    def test_rejects_partial_location(self):
        response = self.client.get("/api/mechanics/", {"latitude": "0.3"})

        self.assertEqual(response.status_code, 400)

    def test_creates_assistance_request(self):
        driver = get_user_model().objects.create_user(
            username="driver@example.com",
            email="driver@example.com",
            password=self.password,
        )
        UserProfile.objects.create(user=driver, role=UserProfile.Role.DRIVER)
        mechanic_user = get_user_model().objects.create_user(
            username="provider@example.com",
            email="provider@example.com",
            password=self.password,
        )
        mechanic_profile = UserProfile.objects.create(
            user=mechanic_user,
            role=UserProfile.Role.MECHANIC,
        )
        verified_mechanic = Mechanic.objects.create(
            user_profile=mechanic_profile,
            name="Verified Mobile Mechanic",
            area="Ntinda",
            latitude=0.3574,
            longitude=32.6131,
            services=["Battery"],
            service_mode=Mechanic.ServiceMode.MOBILE,
            is_demo=False,
            is_verified=True,
        )
        self.client.force_authenticate(user=driver)
        response = self.client.post(
            "/api/requests/",
            {
                "mechanic": verified_mechanic.id,
                "issue": "Battery",
                "notes": "Car will not start",
                "latitude": 0.31,
                "longitude": 32.58,
            },
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(AssistanceRequest.objects.count(), 1)
        self.assertEqual(response.data["status"], AssistanceRequest.Status.PENDING)


class AccountApiTests(APITestCase):
    password = "Kampala!Roadside2026"

    def post_with_csrf(self, client, path, data):
        csrf_response = client.get("/api/auth/csrf/")
        self.assertEqual(csrf_response.status_code, 200)
        return client.post(
            path,
            data,
            format="json",
            HTTP_X_CSRFTOKEN=csrf_response.data["csrfToken"],
        )

    def test_registration_creates_persistent_driver_account_and_session(self):
        response = self.post_with_csrf(
            self.client,
            "/api/auth/register/",
            {
                "name": "Alex Driver",
                "email": "Alex@example.com",
                "password": self.password,
                "role": UserProfile.Role.DRIVER,
            },
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["user"]["email"], "alex@example.com")
        self.assertEqual(response.data["user"]["profile"]["role"], UserProfile.Role.DRIVER)
        user = get_user_model().objects.get(email="alex@example.com")
        self.assertTrue(user.check_password(self.password))
        self.assertNotEqual(user.password, self.password)
        self.assertEqual(
            self.client.get("/api/auth/me/").data["id"],
            user.id,
        )

    def test_registration_rejects_duplicate_email_case_insensitively(self):
        self.post_with_csrf(
            self.client,
            "/api/auth/register/",
            {
                "name": "Alex Driver",
                "email": "alex@example.com",
                "password": self.password,
                "role": UserProfile.Role.DRIVER,
            },
        )
        response = self.post_with_csrf(
            APIClient(enforce_csrf_checks=True),
            "/api/auth/register/",
            {
                "name": "Another Driver",
                "email": "ALEX@EXAMPLE.COM",
                "password": self.password,
                "role": UserProfile.Role.DRIVER,
            },
        )

        self.assertEqual(response.status_code, 400)

    def test_login_and_logout_use_a_csrf_protected_session(self):
        user = get_user_model().objects.create_user(
            username="mechanic@example.com",
            email="mechanic@example.com",
            password=self.password,
            first_name="Sam",
        )
        UserProfile.objects.create(user=user, role=UserProfile.Role.MECHANIC)
        client = APIClient(enforce_csrf_checks=True)

        login_response = self.post_with_csrf(
            client,
            "/api/auth/login/",
            {"email": "MECHANIC@example.com", "password": self.password},
        )
        self.assertEqual(login_response.status_code, 200)
        self.assertEqual(login_response.data["user"]["profile"]["role"], UserProfile.Role.MECHANIC)
        self.assertEqual(client.get("/api/auth/me/").status_code, 200)

        logout_response = self.post_with_csrf(client, "/api/auth/logout/", {})
        self.assertEqual(logout_response.status_code, 204)
        self.assertEqual(client.get("/api/auth/me/").status_code, 403)

    def test_registration_requires_csrf_token(self):
        client = APIClient(enforce_csrf_checks=True)
        response = client.post(
            "/api/auth/register/",
            {
                "name": "Alex Driver",
                "email": "alex@example.com",
                "password": self.password,
                "role": UserProfile.Role.DRIVER,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)
        self.assertFalse(get_user_model().objects.filter(email="alex@example.com").exists())

    def test_registration_rejects_weak_password(self):
        response = self.post_with_csrf(
            self.client,
            "/api/auth/register/",
            {
                "name": "Alex Driver",
                "email": "alex@example.com",
                "password": "password",
                "role": UserProfile.Role.DRIVER,
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("password", response.data)


class ServiceWorkflowApiTests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.driver = user_model.objects.create_user(
            username="driver@example.com",
            email="driver@example.com",
            password="Kampala!Roadside2026",
        )
        self.driver_profile = UserProfile.objects.create(
            user=self.driver,
            role=UserProfile.Role.DRIVER,
        )
        self.mechanic_user = user_model.objects.create_user(
            username="mechanic@example.com",
            email="mechanic@example.com",
            password="Kampala!Roadside2026",
        )
        self.mechanic_profile = UserProfile.objects.create(
            user=self.mechanic_user,
            role=UserProfile.Role.MECHANIC,
        )
        self.mechanic = Mechanic.objects.create(
            user_profile=self.mechanic_profile,
            name="Ntinda Mobile Mechanic",
            area="Ntinda",
            latitude=0.3574,
            longitude=32.6131,
            services=["Tyre change", "Battery"],
            service_mode=Mechanic.ServiceMode.MOBILE,
            is_demo=False,
            is_verified=True,
        )
        self.client.force_authenticate(user=self.driver)
        self.request = self.client.post(
            "/api/requests/",
            {
                "mechanic": self.mechanic.id,
                "issue": "Battery",
                "notes": "Car will not start",
                "latitude": 0.31,
                "longitude": 32.58,
            },
            format="json",
        ).data
        self.assertIn("id", self.request)

    def test_request_is_visible_only_to_driver_and_assigned_mechanic(self):
        driver_response = self.client.get("/api/requests/")
        self.assertEqual([item["id"] for item in driver_response.data], [self.request["id"]])

        self.client.force_authenticate(user=self.mechanic_user)
        mechanic_response = self.client.get("/api/requests/")
        self.assertEqual([item["id"] for item in mechanic_response.data], [self.request["id"]])

        other_driver = get_user_model().objects.create_user(
            username="other@example.com",
            email="other@example.com",
            password="Kampala!Roadside2026",
        )
        UserProfile.objects.create(user=other_driver, role=UserProfile.Role.DRIVER)
        self.client.force_authenticate(user=other_driver)
        self.assertEqual(self.client.get("/api/requests/").data, [])

    def test_mechanic_can_accept_and_complete_request(self):
        self.client.force_authenticate(user=self.mechanic_user)
        accept_response = self.client.patch(
            f"/api/requests/{self.request['id']}/status/",
            {"status": AssistanceRequest.Status.ACCEPTED},
            format="json",
        )
        self.assertEqual(accept_response.status_code, 200)
        self.assertEqual(accept_response.data["status"], AssistanceRequest.Status.ACCEPTED)

        complete_response = self.client.patch(
            f"/api/requests/{self.request['id']}/status/",
            {"status": AssistanceRequest.Status.COMPLETED},
            format="json",
        )
        self.assertEqual(complete_response.status_code, 200)
        self.assertEqual(complete_response.data["status"], AssistanceRequest.Status.COMPLETED)

    def test_mechanic_can_reject_request(self):
        self.client.force_authenticate(user=self.mechanic_user)
        response = self.client.patch(
            f"/api/requests/{self.request['id']}/status/",
            {"status": AssistanceRequest.Status.REJECTED},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], AssistanceRequest.Status.REJECTED)

    def test_invalid_status_transition_is_rejected(self):
        self.client.force_authenticate(user=self.mechanic_user)
        self.client.patch(
            f"/api/requests/{self.request['id']}/status/",
            {"status": AssistanceRequest.Status.REJECTED},
            format="json",
        )
        response = self.client.patch(
            f"/api/requests/{self.request['id']}/status/",
            {"status": AssistanceRequest.Status.ACCEPTED},
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_driver_and_mechanic_can_message_but_other_users_cannot(self):
        self.client.force_authenticate(user=self.driver)
        sent = self.client.post(
            f"/api/requests/{self.request['id']}/messages/",
            {"message": "I am parked near the main road."},
            format="json",
        )
        self.assertEqual(sent.status_code, 201)

        self.client.force_authenticate(user=self.mechanic_user)
        received = self.client.get(f"/api/requests/{self.request['id']}/messages/")
        self.assertEqual(received.status_code, 200)
        self.assertEqual(received.data[0]["message"], "I am parked near the main road.")

        other_driver = get_user_model().objects.create_user(
            username="other@example.com",
            email="other@example.com",
            password="Kampala!Roadside2026",
        )
        UserProfile.objects.create(user=other_driver, role=UserProfile.Role.DRIVER)
        self.client.force_authenticate(user=other_driver)
        self.assertEqual(
            self.client.get(f"/api/requests/{self.request['id']}/messages/").status_code,
            403,
        )

    def test_driver_can_review_completed_request_and_rating_is_updated(self):
        self.client.force_authenticate(user=self.mechanic_user)
        self.client.patch(
            f"/api/requests/{self.request['id']}/status/",
            {"status": AssistanceRequest.Status.ACCEPTED},
            format="json",
        )
        self.client.patch(
            f"/api/requests/{self.request['id']}/status/",
            {"status": AssistanceRequest.Status.COMPLETED},
            format="json",
        )

        self.client.force_authenticate(user=self.driver)
        response = self.client.post(
            f"/api/requests/{self.request['id']}/review/",
            {"rating": 5, "comment": "Quick and helpful."},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.mechanic.refresh_from_db()
        self.assertEqual(self.mechanic.rating, 5.0)
        self.assertEqual(self.mechanic.review_count, 1)
        duplicate = self.client.post(
            f"/api/requests/{self.request['id']}/review/",
            {"rating": 4, "comment": "Duplicate"},
            format="json",
        )
        self.assertEqual(duplicate.status_code, 400)

    def test_unverified_mechanic_profiles_are_hidden_from_search(self):
        second_mechanic_user = get_user_model().objects.create_user(
            username="new-mechanic@example.com",
            email="new-mechanic@example.com",
            password="Kampala!Roadside2026",
        )
        second_profile = UserProfile.objects.create(
            user=second_mechanic_user,
            role=UserProfile.Role.MECHANIC,
        )
        self.client.force_authenticate(user=second_mechanic_user)
        profile_response = self.client.post(
            "/api/mechanic/profile/",
            {
                "name": "New Garage",
                "area": "Ntinda",
                "latitude": 0.35,
                "longitude": 32.61,
                "service_mode": Mechanic.ServiceMode.GARAGE,
                "services": ["Engine"],
            },
            format="json",
        )
        self.assertEqual(profile_response.status_code, 201)
        self.assertFalse(profile_response.data["is_verified"])
        self.assertTrue(
            Mechanic.objects.filter(user_profile=second_profile, is_demo=False).exists()
        )
        public_results = self.client.get("/api/mechanics/").data
        self.assertNotIn(profile_response.data["id"], [item["id"] for item in public_results])
