import csv
from io import TextIOWrapper

import requests
from django.shortcuts import render


# Submit file with courses or subplans with the following formats:
# Note that column order does not matter, as long as data corresponds to the order of the first row.

# Courses:
# code%year%name%units%offeredSem1%offeredSem2
# ARTS1001%2019%Introduction to Arts%6%True%False
# ...

# Subplans:
# code%year%name%units%planType
# ARTI-SPEC%2016%Artificial Intelligence%24%SPEC
# ...
def bulk_data_upload(request):
    context = {}
    context['upload_type'] = ['Courses', 'Subplans']
    content_type = request.GET.get('type')

    if content_type in context['upload_type']:
        context['current_tab'] = content_type

    if request.method == 'POST':
        base_model_url = request.build_absolute_uri('/api/model/')

        # Open file in text mode:
        # https://stackoverflow.com/questions/16243023/how-to-resolve-iterator-should-return-strings-not-bytes
        uploaded_file = TextIOWrapper(request.FILES['uploaded_file'], encoding=request.encoding)

        # Reading the '%' using the csv import module came from:
        # https://stackoverflow.com/questions/13992971/reading-and-parsing-a-tsv-file-then-manipulating-it-for-saving-as-csv-efficie

        # % is used instead of comma since the course name may include commas (which would break this function)
        uploaded_file = csv.reader(uploaded_file, delimiter='%')

        # First row contains the column type headings (code, name etc). We can't add them to the db.
        first_row_checked = False

        # Check if any errors or successes appear when uploading the files.
        # Used for determining type of message to show to the user on the progress of their file upload.
        any_error = False
        any_success = False

        # Stores the index of the column containing the data type of each row,
        # so that the right data is stored in the right column
        # This would also allow columns to be in any order, and courses/subplans would still be added.
        map = {}
        for row in uploaded_file:
            if first_row_checked:
                if content_type == 'Courses':
                    # If number of columns from file doesn't match the model, return error to user.
                    if len(row) != 6:
                        any_error = True
                        break

                    course_instance = \
                        {
                            'code': row[map['code']],
                            'year': int(row[map['year']]),
                            'name': row[map['name']],
                            'units': int(row[map['units']]),
                            'offeredSem1': bool(row[map['offeredSem1']]),
                            'offeredSem2': bool(row[map['offeredSem2']])
                        }

                    # Submit a POST request to the course API with course_instance as data
                    rest_api = requests.post(base_model_url + 'course/', data=course_instance)
                    if rest_api.status_code == 201:
                        any_success = True
                    else:
                        any_error = True

                elif content_type == 'Subplans':
                    if len(row) != 5:
                        any_error = True
                        break

                    subplan_instance = \
                        {
                            'code': row[map['code']],
                            'year': int(row[map['year']]),
                            'name': row[map['name']],
                            'units': int(row[map['units']]),
                            'planType': str(row[map['planType']])
                        }
                    rest_api = requests.post(base_model_url + 'subplan/', data=subplan_instance)
                    if rest_api.status_code == 201:
                        any_success = True
                    else:
                        any_error = True

            else:
                i = 0
                for col in row:
                    map[col] = i
                    i += 1
                first_row_checked = True

        # Display error messages depending on the level of success of bulk upload.
        # There are 3 categories: All successful, some successful or none successful.
        if any_success and not any_error:
            context['user_msg'] = "All items has been added successfully!"
            context['err_type'] = "success"

        elif any_success and any_error:
            context['user_msg'] = "Some items could not be added. Have you added them already? Please check the " \
                                  + content_type + \
                                  " list and try manually adding ones that failed through the dedicated forms."
            context['err_type'] = "warn"

        elif not any_success and any_error:
            context['user_msg'] = "All items failed to be added. " \
                                  "Either you have already uploaded the same contents, " \
                                  "or the format of the file is incorrect. Please try again."
            context['err_type'] = "error"

    return render(request, 'bulkupload.html', context=context)
