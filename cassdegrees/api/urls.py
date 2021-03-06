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
from .views import *

urlpatterns = [
    path('model/sample/', SampleList.as_view()),  # View all objects in a table and add additional records
    path('model/sample/<str:pk>/', SampleRecord.as_view()),  # Can modify and delete individual records
    path('model/course/', CourseList.as_view()),
    path('model/course/<str:pk>/', CourseRecord.as_view()),
    path('model/subplan/', SubplanList.as_view()),
    path('model/subplan/<str:pk>/', SubplanRecord.as_view()),
    path('model/program/', ProgramList.as_view()),
    path('model/program/<str:pk>/', ProgramRecord.as_view()),
    path('model/list/', ListList.as_view()),
    path('model/list/<str:pk>/', ListRecord.as_view()),
    path('search/', search)
]
