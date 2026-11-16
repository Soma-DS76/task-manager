
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LogoutView

from .views import (RegisterAPIView,LoginAPIView,CurrentUserAPIView,ChangePasswordAPIView)

urlpatterns = [
    path('register/', RegisterAPIView.as_view(), name='register'),
    path('login/', LoginAPIView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', CurrentUserAPIView.as_view(), name='current_user'),
    path('change-password/', ChangePasswordAPIView.as_view(), name='change_password'),
    path('logout/', LogoutView.as_view(), name='logout'),
]
