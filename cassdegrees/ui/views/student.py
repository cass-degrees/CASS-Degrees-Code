from django.shortcuts import render
from django.forms.models import model_to_dict
from django.http import HttpRequest


def student_index(request):
    return render(request, 'student_index.html', context={})
