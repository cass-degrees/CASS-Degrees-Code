# CASS Degrees Code
Primary Codebase for the TechLauncher CASS Degrees project

For our landing page please go to: https://github.com/cass-degrees/CASS-Degrees

## Our Git Branching Structure
In this project we will have two main branches: **Master** and **Develop**.

The **Master** branch will only contain completed and working releases that have addressed all the user stories of the relevant release. 
Merges to this branch will only come from the develop branch once a release in develop has been completed and finalised.

The **Develop** branch is the main working branch which will have completed and working user stories for the relevant release that the team is working on.
No one is to directly commit to this branch, it is updated by merges from branches created for the relevant user story or feature that a developer is working on.

The idea is that once someone completes a feature or user story, they will create a new branch with their code (with an appropriate name) and request a *Pull Request* into
the develop branch.

**Pull Requests** are reviewed by the projects team members, the rule is that 2 people must approve of the feature or user story before it can be merged into the develop branch.   
Alternatively, if a day or more has passed then only 1 approval is required for the pull request. This is to ensure the livelihood of our pull requests so that they don't go stale and reduce productivity of other people’s sections who may depend on a pull request.

Please see this document for a full overview and detailed explanation of our branching structure: https://docs.google.com/document/d/1whU7j2F_0RFJ1n1rJsn3H6UcKvLCPCmKZ2J65a7D-9g/edit

## Project Environment Setup 
Please see the SETUP.md in this repository for current releases' installation guide.

Follow the steps in the guide and you should be able to setup the environment on your own local machine.

If there are any issues with the setup process, please create an issue and we will address it as soon as possible.

## User Stories and Acceptance Criteria
The user stories and acceptance criteria can be found here:
1. Semester 1 (MVP): https://docs.google.com/document/d/1nj0gj3BS6XL3B7XeQXr2or4Vxlh1Ah5AFw33DN0ZuBs/edit?usp=sharing
2. Semester 2 (Release 1): https://docs.google.com/document/d/1XCDb8kEl__PzUXI8XVuVpFSuyJ6SXc0zBBnqSY-9d-Y/edit

These stories have been converted into issues which have been assigned to members of the project team.
To trace each member's progress throughout the project, please see the Status Reports folder (_as closed git issues do not give a 100% representation of everyone's contribution_): https://drive.google.com/open?id=1GuVAxwuIDZ3gFAZFIvEV_wut6_rlMRC8 
