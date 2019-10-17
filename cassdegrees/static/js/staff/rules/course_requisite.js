Vue.component('rule_course_requisite', {
    props: {
        "details": {
            type: Object,

            validator(value) {
                // Ensure that the object has all the attributes we need
                if (!value.hasOwnProperty("codes")) {
                    value.codes = [""];
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
            this.details.codes.push(-1);
            this.check_options(false);
            this.do_redraw();
        },
        remove_course(index) {
            // Mutable modification - redraw needed
            this.details.codes.splice(index, 1);
            this.check_options(false);
            this.do_redraw();
        },
        check_options(is_submission) {
            // Ensure all data has been filled in
            this.is_blank = false;
            if (is_submission) {
                for (const index in this.details.codes) {
                    const value = this.details.codes[index];
                    if (value === -1 || value === "") {
                        this.is_blank = true;
                        break;
                    }
                }
            }

            // Check for duplicates
            this.non_unique_options = false;
            const found = [];

            for (const index in this.details.codes) {
                const value = this.details.codes[index];
                if (found.includes(value)) {
                    this.non_unique_options = true;
                    break;
                }
                found.push(value);
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
    template: '#courseRequisiteTemplate'
});
