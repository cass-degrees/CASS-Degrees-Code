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
from django.urls import path

from .views.bulk_data_upload import *
from .views.courses import *
from .views.index import *
from .views.listings import *
from .views.programs import *
from .views.sampleform import *
from .views.subplans import *

urlpatterns = [
    path('', index),
    path('sampleform/', sampleform),
    path('create/course/', create_course),
    path('create/program/', create_program),
    path('create/subplan/', create_subplan),
    path('delete/courses/', delete_course),
    path('delete/programs/', delete_program),
    path('delete/subplans/', delete_subplan),
    path('edit/course/', edit_course),
    path('edit/program/', edit_program),
    path('edit/subplan/', edit_subplan),
    path('list/', data_list),
    path('bulk_upload/', bulk_data_upload),
]
