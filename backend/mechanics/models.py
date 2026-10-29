from django.core.validators import MaxValueValidator, MinValueValidator
from django.conf import settings
from django.db import models


class UserProfile(models.Model):
    class Role(models.TextChoices):
        DRIVER = "driver", "Driver"
        MECHANIC = "mechanic", "Mechanic"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    role = models.CharField(max_length=20, choices=Role.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} ({self.role})"


class Mechanic(models.Model):
    class ServiceMode(models.TextChoices):
        MOBILE = "mobile", "Travels to vehicle"
        GARAGE = "garage", "Visit garage"

    class Service(models.TextChoices):
        TYRE = "Tyre change", "Tyre change"
        BATTERY = "Battery", "Battery"
        TOWING = "Towing", "Towing"
        ENGINE = "Engine", "Engine"
        ELECTRICAL = "Electrical", "Electrical"
        OVERHEATING = "Overheating", "Overheating"

    user_profile = models.OneToOneField(
        UserProfile,
        on_delete=models.CASCADE,
        related_name="provider_profile",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=160)
    area = models.CharField(max_length=100)
    latitude = models.FloatField()
    longitude = models.FloatField()
    service_mode = models.CharField(
        max_length=20,
        choices=ServiceMode.choices,
        default=ServiceMode.MOBILE,
    )
    phone = models.CharField(max_length=30, blank=True)
    rating = models.FloatField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
    )
    review_count = models.PositiveIntegerField(default=0)
    eta = models.CharField(max_length=80, blank=True)
    is_available = models.BooleanField(default=True)
    services = models.JSONField(default=list)
    is_demo = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class AssistanceRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACCEPTED = "accepted", "Accepted"
        REJECTED = "rejected", "Rejected"
        COMPLETED = "completed", "Completed"

    mechanic = models.ForeignKey(
        Mechanic,
        on_delete=models.PROTECT,
        related_name="assistance_requests",
    )
    driver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assistance_requests",
    )
    issue = models.CharField(max_length=80)
    notes = models.CharField(max_length=300, blank=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    service_mode = models.CharField(
        max_length=20,
        choices=Mechanic.ServiceMode.choices,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.issue} for {self.mechanic}"


class RequestMessage(models.Model):
    request = models.ForeignKey(
        AssistanceRequest,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="request_messages",
    )
    message = models.CharField(max_length=2000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]


class Review(models.Model):
    request = models.OneToOneField(
        AssistanceRequest,
        on_delete=models.CASCADE,
        related_name="review",
    )
    mechanic = models.ForeignKey(
        Mechanic,
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    driver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mechanic_reviews",
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    comment = models.CharField(max_length=1000, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.rating} stars for {self.mechanic}"
