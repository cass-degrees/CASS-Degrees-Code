from django.shortcuts import render
from .models import SampleModel
from .serializers import SampleSerializer
from rest_framework import generics


# Create view for browsing contents of the 'Sample' model
class SampleList(generics.ListCreateAPIView):
    queryset = SampleModel.objects.all()
    serializer_class = SampleSerializer


# Create view for browsing individual record in the 'Sample' model.
# Browsable by appending the id of object from the SampleList view (e.g. api/sample/3452/)
class SampleRecord(generics.RetrieveUpdateDestroyAPIView):
    queryset = SampleModel.objects.all()
    serializer_class = SampleSerializer
