from django.shortcuts import render
from .models import *
from django.http import JsonResponse
from .serializers import *
from rest_framework import generics
from django.db.models import Q


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


class ProgramList(generics.ListCreateAPIView):
    queryset = ProgramModel.objects.all()
    serializer_class = ProgramSerializer


class ProgramRecord(generics.RetrieveUpdateDestroyAPIView):
    queryset = ProgramModel.objects.all()
    serializer_class = ProgramSerializer


class ListList(generics.ListCreateAPIView):
    queryset = ListModel.objects.all()
    serializer_class = ListSerializer


class ListRecord(generics.RetrieveUpdateDestroyAPIView):
    queryset = ListModel.objects.all()
    serializer_class = ListSerializer


def search(request):
    """ Queries the database based on the URL parameters

    Url Parameters:
        select -> The name of the table to extract from (e.g. program, subplan, course)
        from   -> A comma-separated list of names to get queries for
        [name] -> The name of a list and the text to search for inside that name (code=COMP finds comp courses)

        These parameters will evaluate to the following SQL query:
            SELECT [select parameters]
            FROM [from parameters]
            WHERE [name parameter 1] in [name 1]
            AND   [name parameter 2] in [name 2]
            ...

    Example queries:
        /api/search/from=course
        /api/search/?select=id,code&from=program
        /api/search/?select=code,name,rules&from=subplan&code=COMP&name=systems%20and&20architecture

    :param request:
    :return <class django.http.response.JsonResponse>:
    """
    model_map = {'program': ProgramModel, 'subplan': SubplanModel, 'course': CourseModel, 'list': ListModel}

    # Extracts a model from the model_map, choosing None if an invalid model was requested
    model = model_map.get(request.GET.get('from'), None)

    # Creates a list of columns for all inputted select parameters
    columns = request.GET.get('select', None)
    columns = columns.split(',') if columns else []

    # Generates a query mapping for "title":"containing text" relationships
    include = {x+"__icontains": request.GET.get(x, None) for x in columns if request.GET.get(x, None)}
    include.update(
        {x + "__iexact": request.GET.get(x+"_exact", None) for x in columns if request.GET.get(x+"_exact", None)}
    )
    query = Q(**include)

    # If the model is valid and all parameters are valid, returns the response, otherwise returning ["Invalid parameter given"]
    if model:
        for parameter in columns:
            if parameter not in [f.name for f in model._meta.fields]:
                return JsonResponse(["Invalid parameter given"], safe=False)
        result = list(model.objects.filter(query).values(*columns).distinct())
    else:
        return JsonResponse(["Invalid parameter given"], safe=False)

    return JsonResponse(result, safe=False)
