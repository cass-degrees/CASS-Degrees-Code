"""cassdegrees URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from .views import index, sampleform, create_program, create_subplan, data_list, manage_courses, manage_subplans, \
    manage_programs, bulk_data_upload, view_

urlpatterns = [
    path('', index),
    path('sampleform/', sampleform),
    path('create_program/', create_program),
    path('create_subplan/', create_subplan),
    path('list/', data_list),
    path('manage_courses/', manage_courses),
    path('manage_subplans/', manage_subplans),
    path('manage_programs/', manage_programs),
    path('bulk_upload/', bulk_data_upload),
    path('view_course/', view_),
    path('view_subplan/', view_),
    path('view_program/', view_),
]
