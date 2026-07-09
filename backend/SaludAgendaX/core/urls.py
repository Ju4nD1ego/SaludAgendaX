from django.urls import path
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(['GET'])
def health_check(request):
    return Response({"status": "ok", "message": "Backend de SaludAgendaX corriendo 🚀"})


urlpatterns = [
    path('health/', health_check),
]