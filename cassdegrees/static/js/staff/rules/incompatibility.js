Vue.component('rule_incompatibility', {
    props: {
        "details": {
            type: Object,

            validator(value) {
                // Ensure that the object has all the attributes we need
                if (!value.hasOwnProperty("incompatible_courses")) {
                    value.incompatible_courses = [""];
                }

                return true;
            }
        }
    },
    data() {
        return {
            "courses": [],
            "info_msg": INFO_MSGS['course'],

            // Display related warnings if true
            "non_unique_options": false,
            "is_blank": false,

            "redraw": false
        }
    },
    created() {
        // Javascript has the best indirection...
        const rule = this;

        const request = new XMLHttpRequest();

        request.addEventListener("load", function () {
            rule.courses = JSON.parse(request.response);
            rule.courses.sort(
                function (a, b) {
                    return a['code'].localeCompare(b['code'])
                }
            );

            rule.check_options(false);
        });
        request.open("GET", "/api/search/?select=code,name&from=course");
        request.send();
    },
    methods: {
        add_course() {
            // Mutable modification - redraw needed
            this.details.incompatible_courses.push(-1);
            this.check_options(false);
            this.do_redraw();
        },
        remove_course(index) {
            // Mutable modification - redraw needed
            this.details.incompatible_courses.splice(index, 1);
            this.check_options(false);
            this.do_redraw();
        },
        check_options(is_submission) {
            // Check for duplicates
            this.non_unique_options = false;
            let found = [];

            for (const index in this.details.incompatible_courses) {
                const value = this.details.incompatible_courses[index];
                if (found.includes(value)) {
                    this.non_unique_options = true;
                    break;
                }
                found.push(value);
            }

            // Ensure all data has been filled in
            this.is_blank = false;
            if (is_submission) {
                for (const index in this.details.incompatible_courses) {
                    const value = this.details.incompatible_courses[index];
                    if (value === -1 || value === "") {
                        this.is_blank = true;
                        break;
                    }
                }
            }

            return !this.non_unique_options && !this.is_blank;
        },
        // https://michaelnthiessen.com/force-re-render/
        do_redraw() {
            this.redraw = true;

            this.$nextTick(() => {
                this.redraw = false;
            });
        }
    },
    template: '#incompatibilityRuleTemplate'
});
