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

from .views.staff.bulk_data_upload import *
from .views.staff.courses import *
from .views.staff.index import *
from .views.staff.listings import *
from .views.staff.programs import *
from .views.staff.subplans import *
from .views.staff.view import *
from .views.staff.lists import *
from .views.pdf import *
from .views.student import *

staff_url_prefix = "staff/"

urlpatterns = [
    path('', student_index),
    path('create/', student_create),
    path('edit/', student_edit),
    path('pdf/', student_pdf),
    path('delete/', student_delete),

    path(staff_url_prefix, index),
    path(staff_url_prefix + 'create/course/', create_course),
    path(staff_url_prefix + 'create/program/', create_program),
    path(staff_url_prefix + 'create/subplan/', create_subplan),
    path(staff_url_prefix + 'create/list/', create_list),
    path(staff_url_prefix + 'delete/courses/', delete_course),
    path(staff_url_prefix + 'delete/programs/', delete_program),
    path(staff_url_prefix + 'delete/subplans/', delete_subplan),
    path(staff_url_prefix + 'delete/lists/', delete_list),
    path(staff_url_prefix + 'edit/course/', edit_course, name='edit_course'),
    path(staff_url_prefix + 'edit/program/', edit_program, name='edit_program'),
    path(staff_url_prefix + 'edit/subplan/', edit_subplan, name='edit_subplan'),
    path(staff_url_prefix + 'edit/list/', edit_list),
    path(staff_url_prefix + 'list/', data_list),
    path(staff_url_prefix + 'bulk_upload/', bulk_data_upload),
    path(staff_url_prefix + 'view/program/', view_section),
    path(staff_url_prefix + 'view/subplan/', view_section),
    path(staff_url_prefix + 'view/course/', view_section),
    path(staff_url_prefix + 'pdf/program/', view_program_pdf),
]
