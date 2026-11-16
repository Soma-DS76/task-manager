from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import TestCase
from rest_framework.test import APIClient


class AuthApiTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='person@example.com',
            email='person@example.com',
            password='SecurePass123!'
        )
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_refresh_token_uses_the_token_refresh_route(self):
        from rest_framework_simplejwt.tokens import RefreshToken

        refresh = RefreshToken.for_user(self.user)
        response = self.client.post(
            '/api/auth/token/refresh/',
            {'refresh': str(refresh)},
            format='json'
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)

    def test_change_password_requires_put(self):
        payload = {
            'old_password': 'SecurePass123!',
            'new_password': 'DifferentSecurePass456!',
            'confirm_new_password': 'DifferentSecurePass456!'
        }

        post_response = self.client.post(
            '/api/auth/change-password/', payload, format='json'
        )
        self.assertEqual(post_response.status_code, 405)

        put_response = self.client.put(
            '/api/auth/change-password/', payload, format='json'
        )
        self.assertEqual(put_response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(payload['new_password']))

    def test_user_email_has_a_database_unique_constraint(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                get_user_model().objects.create_user(
                    username='duplicate@example.com',
                    email=self.user.email,
                    password='SecurePass123!'
                )
