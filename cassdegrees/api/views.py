from django.shortcuts import render
from .models import *
from .serializers import *
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


class CourseList(generics.ListCreateAPIView):
    queryset = CourseModel.objects.all()
    serializer_class = CourseSerializer


class CourseRecord(generics.RetrieveUpdateDestroyAPIView):
    queryset = CourseModel.objects.all()
    serializer_class = CourseSerializer


class SubplanList(generics.ListCreateAPIView):
    queryset = SubplanModel.objects.all()
    serializer_class = SubplanSerializer


class SubplanRecord(generics.RetrieveUpdateDestroyAPIView):
    queryset = SubplanModel.objects.all()
    serializer_class = SubplanSerializer


class CoursesInSubplanList(generics.ListCreateAPIView):
    queryset = CoursesInSubplanModel.objects.all()
    serializer_class = CoursesInSubplanSerializer


class CoursesInSubplanRecord(generics.RetrieveUpdateDestroyAPIView):
    queryset = CoursesInSubplanModel.objects.all()
    serializer_class = CoursesInSubplanSerializer


class DegreeList(generics.ListCreateAPIView):
    queryset = DegreeModel.objects.all()
    serializer_class = DegreeSerializer


class DegreeRecord(generics.RetrieveUpdateDestroyAPIView):
    queryset = DegreeModel.objects.all()
    serializer_class = DegreeSerializer
