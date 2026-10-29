from django.urls import path

from .views import (
    AssistanceRequestListCreateView,
    AssistanceRequestStatusView,
    CurrentAccountView,
    CsrfTokenView,
    HealthView,
    LoginView,
    LogoutView,
    MechanicListView,
    MechanicProfileView,
    MechanicReviewListView,
    RegisterView,
    RequestMessageListCreateView,
    RequestReviewCreateView,
)


urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("auth/csrf/", CsrfTokenView.as_view(), name="auth-csrf"),
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("auth/me/", CurrentAccountView.as_view(), name="auth-me"),
    path("mechanic/profile/", MechanicProfileView.as_view(), name="mechanic-profile"),
    path("mechanics/", MechanicListView.as_view(), name="mechanic-list"),
    path("mechanics/<int:pk>/reviews/", MechanicReviewListView.as_view(), name="mechanic-reviews"),
    path(
        "requests/",
        AssistanceRequestListCreateView.as_view(),
        name="assistance-request-list-create",
    ),
    path(
        "requests/<int:pk>/status/",
        AssistanceRequestStatusView.as_view(),
        name="assistance-request-status",
    ),
    path(
        "requests/<int:pk>/messages/",
        RequestMessageListCreateView.as_view(),
        name="assistance-request-messages",
    ),
    path(
        "requests/<int:pk>/review/",
        RequestReviewCreateView.as_view(),
        name="assistance-request-review",
    ),
]
