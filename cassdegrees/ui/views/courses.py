from django.contrib.auth.decorators import login_required

from api.models import CourseModel, SubplanModel, ProgramModel
from api.views import search

from django.http import HttpResponseNotFound, HttpRequest
from django.shortcuts import render, redirect

from ui.forms import EditCourseFormSnippet
import json
from django.utils import timezone


admin_url_prefix = "/admin/"

list_course_url = admin_url_prefix + "list/?view=Course"


@login_required
def create_course(request):
    duplicate = request.GET.get('duplicate', 'false')
    if duplicate == 'true':
        duplicate = True
    elif duplicate == 'false':
        duplicate = False

    # Initialise instance with an empty string so that we don't get a "may be referenced before assignment" error below
    instance = ""

    # If we are creating a course from a duplicate, we retrieve the instance with the given id
    # (should always come along with 'duplicate' variable) and return that data to the user.
    if duplicate:
        id = request.GET.get('id')
        if not id:
            return HttpResponseNotFound("Specified ID not found")
        # Find the course to specifically create from:
        instance = CourseModel.objects.get(id=int(id))

    if request.method == 'POST':
        form = EditCourseFormSnippet(request.POST)

        if form.is_valid():
            form.save()
            return redirect(list_course_url + '&msg=Successfully Added Course!')

    else:
        if duplicate:
            form = EditCourseFormSnippet(instance=instance)
        else:
            form = EditCourseFormSnippet()

    return render(request, 'createcourse.html', context={
        "edit": False,
        "form": form,
        "courses": CourseModel.objects.values()
    })


@login_required
def delete_course(request):
    data = request.POST
    instances = []

    # Generate an internal request to search api made by Jack
    gen_request = HttpRequest()

    # Grab all the courses in the database
    gen_request.GET = {'select': 'id,code,year', 'from': 'course'}
    courses = json.loads(search(gen_request).content.decode())

    # ids of all the courses that were selected to be deleted
    ids_to_delete = [int(course_id) for course_id in data.getlist('id')]
    if not ids_to_delete:
        return redirect(list_course_url + '&error=Please select a Course to delete!')
    courses_to_delete = [c for c in courses if c['id'] in ids_to_delete]

    error_msg = ""
    instances = []

    for course in courses_to_delete:
        gen_request.GET = {'select': 'code', 'from': 'course', 'code': course['code']}
        duplicate_courses = json.loads(search(gen_request).content.decode())
        if len(duplicate_courses) < 2:
            gen_request.GET = {'select': 'code,year,rules', 'from': 'subplan', 'rules': course['code']}
            # subplans which depend on course where its code is equal to course['code']
            subplans = json.loads(search(gen_request).content.decode())
            gen_request.GET = {'select': 'code,year,rules', 'from': 'program', 'rules': course['code']}
            # programs which depend on course where its code is equal to course['code']
            programs = json.loads(search(gen_request).content.decode())

            # if there are any subplans/programs that could be affected by the deletion of the selected courses
            if len(subplans) > 0 or len(programs) > 0:
                # compose error message
                if len(subplans) > 0:
                    for subplan in subplans:
                        error_msg += "Course Code: '" + course['code'] + "'(" + str(course['year']) + \
                                     ") is used by Subplan Code: '" + subplan['code'] + "'(" + \
                                     str(subplan['year']) + ").\n"
                if len(programs) > 0:
                    for program in programs:
                        error_msg += "Course Code: '" + course['code'] + "'(" + str(course['year']) + \
                                     ") is used by Program Code: '" + program['code'] + "'(" + \
                                     str(program['year']) + ").\n"
                continue  # dont append course to the list instances
        instances.append(CourseModel.objects.get(id=course['id']))

    if len(error_msg) > 0:
        return redirect(list_course_url + '&error=Failed to Delete Course(s)!'
                                          '\n' + error_msg + '\nPlease check dependencies!')

    if "confirm" in data:
        for instance in instances:
            instance.delete()

        return redirect(list_course_url + '&msg=Successfully Deleted Course(s)!')
    else:
        return render(request, 'deletecourses.html', context={
            "instances": instances
        })


@login_required
def edit_course(request):
    id = request.GET.get('id')
    if not id:
        return HttpResponseNotFound("Specified ID not found")

    # Find the program to specifically edit
    instance = CourseModel.objects.get(id=int(id))

    dependencies = dict()  # programs/subplans that are dependent on this course instance {'code': 'name'}

    # Generate an internal request to search api made by Jack
    gen_request = HttpRequest()

    # Grab all the courses in the database
    gen_request.GET = {'select': 'id,code,name,rules', 'from': 'program', 'rules': instance.code}
    programs = json.loads(search(gen_request).content.decode())
    gen_request.GET = {'select': 'id,code,name,rules', 'from': 'subplan', 'rules': instance.code}
    subplans = json.loads(search(gen_request).content.decode())

    # Set message to user if needed. Setting it to 'None' will not display the message box.
    message = None

    # if there are programs/subplans that depend on the course code
    if len(programs) + len(subplans) > 0:
        for program in programs:
            dependencies[program['code']] = program['name']
        for subplan in subplans:
            dependencies[subplan['code']] = subplan['name']

    if request.method == 'POST':
        form = EditCourseFormSnippet(request.POST, instance=instance)
        form.fields['code'].disabled = len(programs) + len(subplans) > 0
        if form.is_valid():
            instance.lastUpdated = timezone.now().strftime('%Y-%m-%d')
            instance.save(update_fields=['lastUpdated'])
            form.save()
            # POST Requests only carry boolean values over as string
            # Only redirect the user to the list page if the user presses "Save and Exit".
            # Otherwise, simply display a success message on the same page.
            if request.POST.get('redirect') == 'true':
                return redirect(list_course_url + '&msg=Successfully Edited Course!')
            else:
                message = "Successfully Edited Course!"

    else:
        form = EditCourseFormSnippet(instance=instance)
        form.fields['code'].disabled = len(programs) + len(subplans) > 0

    return render(request, 'createcourse.html', context={
        'render': {'msg': message},
        "edit": True,
        "form": form,
        "courses": CourseModel.objects.values(),
        "dependencies": dependencies
    })
