from django.contrib import admin

from .models import AssistanceRequest, Mechanic, RequestMessage, Review, UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "role", "created_at"]
    list_filter = ["role", "created_at"]
    search_fields = ["user__email", "user__first_name", "user__last_name"]


@admin.register(Mechanic)
class MechanicAdmin(admin.ModelAdmin):
    list_display = ["name", "area", "service_mode", "is_available", "is_verified", "is_demo"]
    list_filter = ["service_mode", "is_available", "is_verified", "is_demo"]
    search_fields = ["name", "area"]
    actions = ["verify_mechanics", "unverify_mechanics"]

    @admin.action(description="Verify selected real mechanic profiles")
    def verify_mechanics(self, request, queryset):
        queryset.filter(is_demo=False).update(is_verified=True)

    @admin.action(description="Remove verification from selected profiles")
    def unverify_mechanics(self, request, queryset):
        queryset.update(is_verified=False)


@admin.register(AssistanceRequest)
class AssistanceRequestAdmin(admin.ModelAdmin):
    list_display = ["id", "issue", "driver", "mechanic", "status", "created_at"]
    list_filter = ["status", "created_at"]
    search_fields = ["issue", "driver__email", "mechanic__name"]


@admin.register(RequestMessage)
class RequestMessageAdmin(admin.ModelAdmin):
    list_display = ["request", "sender", "created_at"]
    search_fields = ["message", "sender__email"]
    readonly_fields = ["request", "sender", "message", "created_at"]


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ["mechanic", "driver", "rating", "created_at"]
    list_filter = ["rating", "created_at"]
    search_fields = ["mechanic__name", "driver__email", "comment"]
    readonly_fields = ["request", "mechanic", "driver", "rating", "comment", "created_at"]
