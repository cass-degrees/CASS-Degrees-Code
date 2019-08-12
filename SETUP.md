# CASS Degrees Code Setup Guide
This document will guide you through the steps to setup your own local environment for the current CASS Degrees project release

For the main readme please go to go to README.md file located in this repository. 

## How to run our Django app (Windows)
*Created by Daniel Jang*

**NOTE: This guide is focused for Windows users, but the basic steps for other OS is similar (Install Python -> install PostgreSQL -> Create DB -> set up PyCharm -> run)**



1. Install Python version 3.7.2 from this link (Mac users can also choose to do apt-get instead):
https://www.python.org/downloads/release/python-372/
Select the option to add Python to your PATH on Windows

2. Install PostgreSQL server (more for Windows users, Mac users can refer to this for steps 2-4): https://medium.com/@viviennediegoencarnacion/getting-started-with-postgresql-on-mac-e6a5f48ee399):
https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

3. During PostgreSQL installation, leave everything default until you get to the password step:
    3. Password: postgres
    3. Leave everything after that as default, but there is no need to install StackBuilder.

4. Open pgAdmin4.exe found in “C:\Program Files\PostgreSQL\11\pgAdmin 4\bin” (or wherever the program was installed).
    4. If PostgreSQL is not present in Program Files, try Program Files (x86).

5. Create new database for our Django app: 
    5. On the left side, you should see a dropdown menu called Servers (1).
    5. Open that by double clicking, and you will see PostgreSQL. Open that and enter the password we set in step 3a.
    5. Now you will see “Databases (1)” underneath PostgreSQL. Right click on it and click “Create > Database…”
    5. Call the new DB “cassdegrees” (without quotes). Make sure the owner is set as “postgres” and then click save.

6. Install PyCharm Professional and activate it using your educational JetBrains account (or start a free trial):
    6. https://www.jetbrains.com/pycharm/download/#section=windows

7. Open our project by checking out from version control and selecting git.
    7. Login to GitHub and select our project (CASS-Degrees-Code) and choose directory where you want to save it if you want to change from default.
    7. Ensure that you are in the right git branch by checking the branch in the bottom right of PyCharm. It should initially say “Git: master”. Click on it and change it to a branch you want to actually see.
        7. If the branch isn’t there, go to “VCS > Git > Fetch” and try again.
        7. If the branch is there, click on it and then click “Checkout As...” and then leave the default as is and click OK.
        7. Don’t add \.idea\vcs.xml to git ***** (UNKNOWN DOWNSIDES, will confirm later if step is necessary. Don’t check “Remember” for now)

8. Ensure that PyCharm has the correct project interpreter:
    8. Go to “File > Settings > Project: CASS-Degrees-Code > Project Interpreter” and check if interpreter is the Python version you installed and is not invalid.
    8. If invalid, click on the Python 3.6 (or whatever it says in red) and click on “Show All…”
    8. Remove all invalid ones.
    8. On the top right of the “Project Interpreters” window, click on the + button.
    8. For the “Base interpreter” field, find the correct python.exe file and click OK:
        8. Mine was: “C:\Users\<USERNAME>\AppData\Local\Programs\Python\Python37\python.exe” but yours may be in Program Files.
        8. After virtual environment is made and the correct Python interpreter appears in “Project Interpreters”, click OK and then OK again to close Settings.

9. Click “Add Configuration” on top right of PyCharm to add Django support:
    9. On the left, click the “+” and click on “Django Server”
    9. If you see an error saying “Error: Please enable Django support for the project” on the bottom of the window, click on the “Fix” button.
        9. Tick “Enable Django Support”.
        9. For Django project root, find the “cassdegrees” folder within the cloned git repository and click OK (NOT THE cassdegrees WITHIN cassdegrees FOLDER!!).
        9. For Settings, find the “settings.py” under “cassdegrees” folder found within the parent “cassdegrees” folder.
        9. Rest can be left blank.
        9. Click OK.
    9. Name your configuration to whatever you want, I just called it “cassdegrees”.
    9. If you see an error saying “Error: Django is not importable in this environment”
        9. Open  “cassdegrees\requirements.txt” in pycharm
        9. If you don’t have the requirements installed, pycharm will prompt you with a yellow bar at the top of the file.
        9. Click “install packages”
    9. Tick “Run browser” if you want a new window to automatically pop up.

10. You will need to install extra dependencies for WeasyPrint, the framework that enables PDF generation. Follow the instructions on the WeasyPrint installation guide to install the GTK+ libraries: https://weasyprint.readthedocs.io/en/stable/install.html

11. At some point, a prompt will appear that requests connection to the database. Fill in the required fields (e.g. passwords), test connection and if successful, press OK.

12. If your models for the database has been altered (code in models.py), make sure you perform the migrations. This is necessary for the tables in our PostgreSQL database to be updated.
Go to terminal in PyCharm at bottom left ish, change directory so that manage.py is in your working directory, then run:
python manage.py makemigrations
python manage.py migrate

13. Now, try running the Django app by clicking the green triangle on the top right.

14. Now, you should be greeted with Django’s main page (with a flying rocket) which says that your installation is successful. From this point on, all you need to do is to switch branches as necessary and then click the green arrow.

15. To use the administrator page (127.0.0.1:8000/admin/), add yourself as the superuser:
    15. python manage.py createsuperuser
    15. You can set any value for username, email or password. Remember it though so you can log into the admin website. I did u: admin and pw: admin.

**If you made it this far then *CONGRATULATIONS!***     
**You now have a working local environment to play with!**

**If you made it this far and it doesn't work...**      
**Please create an issue or raise it to one of our project members and we will
try to assist you as soon as possible to the best of our abilities!**