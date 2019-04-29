import requests
from api.models import CoursesInSubplanModel
from django.shortcuts import render


# inspired by the samepleform function created by Daniel Jang
def manage_courses(request):
    # Reads the 'action' attribute from the url (i.e. manage/?action=Add) and determines the submission method
    action = request.GET.get('action', 'Add')
    id_to_edit = request.GET.get('id', None)

    courses = requests.get(request.build_absolute_uri('/api/model/course/?format=json')).json()
    subplans = requests.get(request.build_absolute_uri('/api/model/subplan/?format=json')).json()
    # If POST request, redirect the received information to the backend:
    render_properties = {
        'msg': None,
        'msg_type': None,
        'is_confirm': False
    }

    if request.method == 'POST':
        model_api_url = request.build_absolute_uri('/api/model/course/')
        post_data = request.POST
        perform_function = post_data.get('perform_function')

        # If the post request came from itself (managecourses.html -> managecourses.html), then it must mean that
        # course information has been requested by user to be either added or edited.
        if perform_function == 'Add/Edit data to db':
            if action == 'Add':
                # Create a python dictionary with exactly the same fields as the model (in this case, CourseModel)
                offered_sems = post_data.getlist('semesters[]')
                course_instance = \
                    {
                        'code': post_data.get('code'),
                        'year': post_data.get('year'),
                        'name': post_data.get('name'),
                        'units': post_data.get('units'),
                        'offeredSem1': 'semester1' in offered_sems,
                        'offeredSem2': 'semester2' in offered_sems
                    }
                # Submit a POST request to the course API with course_instance as data
                rest_api = requests.post(model_api_url, data=course_instance)
                if rest_api.status_code == 201:
                    render_properties['msg'] = 'Course successfully added!'
                    render_properties['msg_type'] = 'msg-success'
                else:
                    render_properties['msg_type'] = 'msg-error'
                    # detects if the course already exists
                    if 'The fields code, year must make a unique set.' in rest_api.json()['non_field_errors']:
                        render_properties['msg'] = "The course you are trying to create already exists!"
                    else:
                        render_properties['msg'] = "Unknown error while submitting document. Please try again."

            elif action == 'Edit':
                if id_to_edit:
                    render_properties['hide_form'] = False
                    # Patch requests (editing an already existing resource only requires fields that are changed
                    offered_sems = post_data.getlist('semesters[]')
                    course_instance = \
                        {
                            'id': id_to_edit,
                            'code': post_data.get('code'),
                            'year': post_data.get('year'),
                            'name': post_data.get('name'),
                            'units': post_data.get('units'),
                            'offeredSem1': 'semester1' in offered_sems,
                            'offeredSem2': 'semester2' in offered_sems
                        }

                    rest_api = requests.patch(model_api_url + id_to_edit + '/', data=course_instance)

                    if rest_api.status_code == 200:
                        render_properties['msg'] = 'Course information successfully modified!'
                        render_properties['msg_type'] = 'msg-success'
                    else:
                        render_properties['msg_type'] = 'msg-error'
                        render_properties['msg'] = "Failed to edit course information. Please try again."

        # If the request came from list.html (from the add, edit and delete button from the courses list page),
        # fetch and pre-fill the course info on the edit form if edit button was clicked on,
        # or delete the selected course immediately.
        elif perform_function == 'retrieve view from selected' or perform_function == 'confirm deletion':
            if action == 'Edit':
                id_to_edit = ''.join(filter(lambda x: x.isdigit(), id_to_edit))
                if id_to_edit:
                    render_properties['hide_form'] = False
                    current_course_info = requests.get(model_api_url + id_to_edit + '/?format=json').json()
                    current_course_info['id'] = id_to_edit
                    render_properties['edit_course_info'] = current_course_info

                else:
                    render_properties['msg_type'] = 'msg-error'
                    render_properties['hide_form'] = True
                    render_properties['msg'] = "Please select a course to edit!"

            elif action == 'Delete':
                rest_api = None
                ids_to_delete = post_data.getlist('id')
                used_subplans = []
                courses_in_subplans = list(CoursesInSubplanModel.objects.all().values())
                for id_to_delete in ids_to_delete:
                    if perform_function == 'confirm deletion':  # if user has clicked 'yes' on the confirmation page
                        rest_api = requests.delete(model_api_url + id_to_delete + '/')
                    else:
                        if not courses_in_subplans:  # delete immediately if no subplans use the course
                            rest_api = requests.delete(model_api_url + id_to_delete + '/')
                        else:
                            for course in courses_in_subplans:
                                # if course being deleted is in current subplan
                                if int(id_to_delete) == int(course['courseId_id']):
                                    # TODO: improve this using django queries
                                    used_subplans.extend(
                                        [subplan['name'] + '(' + subplan['code'] + ')' for subplan in subplans if
                                         course['subplanId_id'] == subplan['id']])
                if used_subplans:  # if there any subplans that use the course
                    render_properties['is_confirm'] = True
                    render_properties['msg_type'] = 'msg-warn'
                    render_properties['msg'] = 'The Sub-Plan(s) ' + ', '.join(used_subplans) + \
                                               ' use this course. Do you want to continue?'
                elif rest_api is None:
                    render_properties['msg_type'] = 'msg-error'
                    render_properties['msg'] = 'Please select a course to delete!'
                else:
                    if rest_api.status_code == 204:
                        render_properties['msg_type'] = 'msg-success'
                        render_properties['msg'] = 'Course successfully deleted!'
                    else:
                        render_properties['msg_type'] = 'msg-error'
                        render_properties['msg'] = "Failed to delete course. " \
                                                   "An unknown error has occurred. Please try again."

    return render(request, 'managecourses.html', context={'action': action, 'courses': courses,
                                                          'render': render_properties})
