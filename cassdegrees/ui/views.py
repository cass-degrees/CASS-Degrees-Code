from django.shortcuts import render
import os


# Create your views here.
# I added a very simple sample request handler, this is very simple and all it does is load index.html from templates.
def index(request):
    return render(request, 'index.html', context={})
