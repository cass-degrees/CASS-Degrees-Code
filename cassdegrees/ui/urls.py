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
from .views.pdf import *
from .views.programs import *
from .views.sampleform import *
from .views.subplans import *
from .views.view_ import *
from .views.student import *

urlpatterns = [
    path('', student_index),
    path('create/', student_create),
    path('edit/', student_edit),
    path('delete/', student_delete),

    path('admin/home/', index),
    path('admin/sampleform/', sampleform),
    path('admin/create/course/', create_course),
    path('admin/create/program/', create_program),
    path('admin/create/subplan/', create_subplan),
    path('admin/delete/courses/', delete_course),
    path('admin/delete/programs/', delete_program),
    path('admin/delete/subplans/', delete_subplan),
    path('admin/edit/course/', edit_course, name='edit_course'),
    path('admin/edit/program/', edit_program, name='edit_program'),
    path('admin/edit/subplan/', edit_subplan, name='edit_subplan'),
    path('admin/list/', data_list),
    path('admin/bulk_upload/', bulk_data_upload),
    path('admin/view/program/', view_),
    path('admin/view/subplan/', view_),
    path('admin/view/course/', view_),
    path('admin/pdf/program/', view_program_pdf),
]
