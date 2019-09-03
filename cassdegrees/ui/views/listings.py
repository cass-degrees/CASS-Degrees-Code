from django.contrib.auth.decorators import login_required

from api.models import ProgramModel, SubplanModel, CourseModel, ListModel
from django.db.models import Q
from django.shortcuts import render


staff_url_prefix = "/staff/"


def data_dict_as_displayable(data):
    """
    Rename and drop elements of a data dictionary ("Program", "Subplan", "Course") such that they are human
    readable.

    :return: A readable data dictionary.
    """

    new_dict = {}

    # Columns that are needed
    desired_columns = {
        'Program': ['id', 'code', 'year', 'name', 'units', 'lastUpdated'],
        'Subplan': ['id', 'code', 'year', 'name', 'planType', 'lastUpdated'],
        'Course': ['id', 'code', 'year', 'name', 'units', 'lastUpdated'],
        'List': ['id', 'name', 'year', 'lastUpdated']
    }

    for key, value in data.items():
        # List containing dicts - explicit cast
        value_dict_lists = list(value)
        desired_sub_columns = desired_columns[key]

        output_list = []
        for value_dict in value_dict_lists:
            # https://stackoverflow.com/questions/5352546/extract-subset-of-key-value-pairs-from-python-dictionary-object
            new_sub_dict = {k.title(): value_dict[k] for k in desired_sub_columns}
            output_list.append(new_sub_dict)

        new_dict[key] = output_list

    return new_dict


@login_required
def data_list(request):
    """ Generates a table based on the JSON objects stored in 'data'

    NOTE: For the page to generate the tabs correctly, the api table data must be put in the context
    under the dictionary {'data': {'RELATION': RELATION_DATA, ...}}. To link to the actual data correctly,
    ensure the RELATION text is the same as what is called in the API (e.g. /api/model/RELATION/?format=json)

    :param request:
    :return <class django.http.response.HttpResponse>:
    """
    query = request.GET.get('q', '')

    render_properties = {
        'msg': request.GET.get('msg'),
        'error': request.GET.get('error'),
        'staff_url_prefix': staff_url_prefix
    }
    # No search, render default page
    if not query:
        return render(request, 'list.html',
                      context={
                          'data': data_dict_as_displayable(
                              {
                                  'Program': ProgramModel.objects.values(),
                                  'Subplan': SubplanModel.objects.values(),
                                  'Course': CourseModel.objects.values(),
                                  'List': ListModel.objects.values()
                              }
                          ),
                          'render': render_properties})

    # User search, render results
    else:
        # Remove common words and make the query set unique and uppercase
        stopwords = ['and', 'or', 'for', 'in', 'the', 'of', 'on', 'to']
        processed_query = [x.upper() for x in query.replace(',', '').split(' ') if x not in stopwords]

        # Create blank queries for text and dates (Allows AND relationship between dates and text)
        # The AND/OR representations are there to give higher priority to results that contain all keywords
        new_query = {x: {'AND': Q(), 'OR': Q(), 'date': Q()} for x in ['Course', 'Subplan', 'Program', 'List']}

        # Function that takes an input dict and a sub-query, and appends the sub-query based on the appropriate logic
        def build_query(target, q):
            target['AND'] &= q
            target['OR'] |= q

        # Generate queries based on the processed query string
        for term in processed_query:
            # If the current term is of the form TEXT1234, perform a case insensitive search on course codes
            if len(term) == 8 and term[:4].isalpha() and term[4:].isnumeric():
                build_query(new_query['Course'], Q(code__iexact=term))
            # If the term ends with '-MAJ', '-MIN', or '-SPEC', search for subplans containing the inputted term
            elif term[-4:] == '-MAJ' or term[-4:] == '-MIN' or term[-5:] == '-SPEC':
                build_query(new_query['Subplan'], Q(code__icontains=term))
            # If the term is a year-like number, remove results outside that year unless the year in the course code
            # or name
            elif len(term) == 4 and term.isnumeric():
                # NOTE: The name and code search is done because Program names can have numbers and course names
                #       can have dates

                # BUG: This implementation will not return a course with a year in the name unless it matches all
                #      other keywords e.g. CHIN2019 will not show up in a search for `COMP 2019`, but it will appear
                #      in a search for `COMP CHIN`
                new_query['Course']['date'] |= Q(year=int(term)) | Q(name__icontains=term) | Q(code__icontains=term)
                new_query['Subplan']['date'] |= Q(year=int(term)) | Q(name__icontains=term) | Q(code__icontains=term)
                new_query['Program']['date'] |= Q(year=int(term)) | Q(name__icontains=term) | Q(code__icontains=term)
            # If the search term has no obvious structure, search for it in the code and name fields
            else:
                build_query(new_query['Course'], Q(code__icontains=term) | Q(name__icontains=term))
                build_query(new_query['Subplan'], Q(code__icontains=term) | Q(name__icontains=term))
                build_query(new_query['Program'], Q(code__icontains=term) | Q(name__icontains=term))

        # If the program, subplan, or course searches are non-empty, query the database
        data = {}
        for target, model in [('Program', ProgramModel), ('Subplan', SubplanModel), ('Course', CourseModel)]:
            # If the query is not blank, search for it in the database (Prevents unnecessary searches)
            if new_query[target]['AND'].children or new_query[target]['date'].children:
                # SELECT from the the appropriate relation with the AND and OR queries
                data[target] = list(model.objects.filter(new_query[target]['AND'], new_query[target]['date']).values())
                or_query = list(model.objects.filter(new_query[target]['OR'], new_query[target]['date']).values())
                # Create an exclusions list of all the results found by the AND query
                exclusions = [elm['id'] for elm in data[target]]
                # Add to the OR results to the end of the AND list, assuming they aren't already in there
                # The result of this will be the list [High_Priority_Queries]+[Low_Priority_Queries]
                data[target] += [x for x in or_query if x['id'] not in exclusions]

        # Remove relations that returned no data so the tabs do not appear in the list page
        data = {k: v for k, v in data.items() if v}

        # Render the requested data and autofill the query in the search
        return render(request, 'list.html', context={'autofill': query, 'data': data_dict_as_displayable(data),
                                                     'render': render_properties})
