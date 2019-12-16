Vue.component('modal', {
    props: ['course'],
    data: function(){
        return {
            style : {
                "position": "absolute",
                "z-index": 3,
                'display': 'inline-flex',
                "visibility": "hidden",
            },
            showModalBody: false,
            headerStyle: {
                width: 0
            }
        }
    },
    // create a observer for class change
    mounted() {
        this.observer = new MutationObserver(mutations => {
            for (const m of mutations) {
                const newValue = m.target.getAttribute(m.attributeName);
                this.$nextTick(() => {
                    this.onClassChange(newValue, m.oldValue);
                });
            }
        });

        this.observer.observe(this.$refs.modal, {
            attributes: true,
            attributeOldValue : true,
            attributeFilter: ['class'],
        });

    },

    beforeDestroy() {
        this.observer.disconnect();
    },
    computed: {
        getStyle: function(){
            if (!this.style) {
                return {}
            }
            let style = this.style;
            let window = this.$parent.window;
            let modalWidth = (window.width *.8 > 800 ) ? 800 : window.width *.8;
            let modalHeight = ( window.height *.8 > 480 ) ? 480 : window.height *.8;
            let modalLeft = (window.width - modalWidth)/2;
            let modalTop = (window.height - modalHeight)/2.5;
            style.width = modalWidth + 'px'
            style.height = modalHeight + 'px'
            style.left = modalLeft + 'px'
            style.top = modalTop + 'px'
            return style
        },
        getEvent: function () {
            if (this.$parent.modalState.selectedMeeting){
                return this.$parent.modalState.selectedMeeting.dataevent
            }
        },
    },
    methods: {
        closeModalClick: function () {
            this.$parent.closeModal()
        },
        onClassChange: function(classAttrValue) {
            const classList = classAttrValue.split(' ');
            if (classList.includes('cd-schedule-modal__opening')){
                this.modalOpenAnimate()
            }
            if (classList.includes('cd-schedule-modal__closing')){
                this.style.visibility = 'hidden'
                this.modalCloseAnimate()
            }
        },
        modalShowEventDetail: function () {
            this.showModalBody = true
        },
        afterModalBodyEnter: function() {
            this.$parent.modalState.modalIsOpening = false
        },

        modalOpenAnimate: function () {
            // get meeting block's rectangle
            let meetingRec = this.$parent.modalState.selectedMeeting.$el.getBoundingClientRect();
            // get modal header's rec, header is the left column of modal
            let modalHeaderRec = this.$refs.header.getBoundingClientRect();
            // get width of the whole modal, we want to set header column 20% of modal
            let width = parseInt(this.getStyle.width.slice(0, this.getStyle.width.length-2))
            this.headerStyle.width = width * 0.2+'px'
            // input to myEle is the final location of modal header.
            let myele = new myEle(modalHeaderRec.left, modalHeaderRec.top, width * 0.2, modalHeaderRec.height);
            let transition_header__bg =
                myele.styleMoveAndScaleFrom(meetingRec.left, meetingRec.top, meetingRec.width, meetingRec.height, 0.5);

            // add a call back function here on complete
            transition_header__bg.onComplete = this.modalShowEventDetail
            // make the modal visible when animation start
            transition_header__bg.onStart = this.hideShowModal
            gsap.from('.cd-schedule-modal__opening .cd-schedule-modal__header-bg', transition_header__bg)

            // header content are only for course code and title part of header
            let transition_header__content =
                myele.styleMoveFrom(meetingRec.left, meetingRec.top, 0.5)
            gsap.from('.cd-schedule-modal__opening .cd-schedule-modal__content', transition_header__content);
        },
        modalCloseAnimate: function () {
            this.showModalBody = false
            this.$parent.modalState.modalIsClosing = false
        },
        hideShowModal: function () {
            this.style.visibility = this.style.visibility === 'hidden' ? 'visible' : 'hidden'
        },


    },
    template : "<div ref=\"modal\" :data-event='getEvent' :style='this.getStyle'>" +
        "       <div class=\"cd-schedule-modal__header\" :style='this.headerStyle' ref='header'>" +
        "        <div class=\"cd-schedule-modal__content\" :style='this.headerStyle'>{{this.show}}" +
        "           <span class=\"cd-schedule-modal__date\"></span>" +
        "           <h3 class=\"cd-schedule-modal__name\">{{this.course.code}}</h3>" +
        "           <h4 class=\"cd-schedule-modal__name\">{{this.course.courseTitle}}</h4>" +
        "        </div>" +
        "        <div class=\"cd-schedule-modal__header-bg\" :style='this.headerStyle'></div>" +
        "       </div>" +
        "       <transition name='modal-body' v-on:after-enter=\"afterModalBodyEnter\">" +
            "       <div v-if='showModalBody' class=\"cd-schedule-modal__body\">" +
            "        <div class=\"cd-schedule-modal__event-info\">" +
            "           <sectionselection :courses='this.course'></sectionselection>" +
            "        </div>" +
            "        <div class=\"cd-schedule-modal__body-bg\"></div>" +
            "      </div>" +
        "       </transition>" +
        "      <a href=\"#0\" v-on:click='this.closeModalClick' class=\"cd-schedule-modal__close text-replace\">Close</a>\n" +
        "    </div>"
});


Vue.component('sectionselection', {
    props: ['courses'],
    computed: {
        allTeachers: function () {
            let result = '';
            if (Object.keys(this.courses).includes('meetings')){
                Object.keys(this.courses.meetings).forEach(keys => {
                    let meeting = this.courses.meetings[keys];
                    meeting.instructors.forEach(instructor => {
                        result += (instructor + '(' + keys +'), ')
                    })
                });
                return result.slice(0,result.length-2)
            }
        },
        courseid: function () {
            if (this.courses) {
                return this.courses.keyCode
            }
        }
    },
    methods: {
        getter: function (att) {
            if (this.courses) {
                return this.courses[att]
            }
        },
        getSectionWithTeachingMethod: function (teachingMethod) {
            lecs = []
            if (this.courses) {
                Object.keys(this.courses.meetings).forEach(key => {
                    if (this.courses.meetings[key].teachingMethod === teachingMethod) {
                        lecs.push(key)
                    }
                })
            }
            return lecs
        },
    },
    template:
        '<div class="cd-schedule-modal__event-info">' +
            '<div>' +
                '<div>{{this.getter(\'courseDescription\')}}</div>' +
                '<div style="margin-top:10px">' +
                    '<div v-if="this.allTeachers !== \'\'">\n' +
                        '<strong>Instructor:</strong>\n' +
                        '<span>{{this.allTeachers}}</span>\n' +
                    '</div>'+
                    "<div v-if=\"this.getter(\'prerequisite\')\"><strong>Prerequisites:</strong>{{this.getter(\'prerequisite\')}}</div>" +
                    "<div v-if=\"this.getter(\'corequisite\')\"><strong>Corequisite: </strong>{{this.getter(\'corequisite\')}}</div>" +
                    "<div v-if=\"this.getter(\'exclusion\')\"><strong>Exclusions: </strong>{{this.getter(\'exclusion\')}}</div>" +
                    "<div class='LEC' v-if='this.getSectionWithTeachingMethod(\"LEC\").length > 0'>" +
                        "<label><strong>Lecture: {{this.courseid}}</strong></label>" +
                        "<selectionbutton v-for='key in this.getSectionWithTeachingMethod(\"LEC\")' :sectionid=key :course=\"getter('keyCode')\"></selectionbutton>" +
                    "</div>" +
                    "<div class='TUT' v-if='this.getSectionWithTeachingMethod(\"TUT\").length > 0'>" +
                        "<label><strong>Tutorial: </strong></label>" +
                        "<selectionbutton v-for='key in this.getSectionWithTeachingMethod(\"TUT\")' :sectionid=key :course=\"getter('keyCode')\"></selectionbutton>" +
                    "</div>" +
                    "<div class='PRA' v-if='this.getSectionWithTeachingMethod(\"PRA\").length > 0'>" +
                        "<label><strong>Practice: </strong></label>" +
                        "<selectionbutton v-for='key in this.getSectionWithTeachingMethod(\"PRA\")' :sectionid=key :course=\"getter('keyCode')\"></selectionbutton>" +
                    "</div>" +
                '</div>'+
            '</div>'+
        '</div>'
});

Vue.component('selectionbutton', {
    props: ['sectionid', 'course'],
    data: function () {
        return {
            classList: ['sectionButton']
        }
    },
    mounted: function(){
        let selections = this.$parent.$parent.$parent.selections
        if (this.course in selections & selections[this.course].includes(this.sectionid)){
            this.classList.push('selected')
        }
    },
    methods: {
        buttonClick: function () {
            if (this.classList.includes('selected')){
                this.classList = this.classList.filter(e => e !== 'selected')
                this.$parent.$parent.$parent.unSelectSection(this.course, this.sectionid)

            } else {
                this.classList.push('selected')
                this.$parent.$parent.$parent.selectSection(this.course, this.sectionid)

            }
        }
    },
    template: "<button :class='this.classList' v-on:click='this.buttonClick'>{{sectionid}}</button>"
})

Vue.component('timetable', {
    props: ['time'],
    template: '<li><span>{{time}}</span></li>'
});


Vue.component('meeting', {
    props: ['meeting'],
    data: function(){
        return {
            selected: false,
            style: {},
            meetingClassList: ['cd-schedule__event']
        }
    },
    computed: {
        courseCode: function () {
            return this.meeting['code']
        },
        courseTitle: function () {
            return this.meeting['courseTitle']
        },
        startTime: function () {
            return this.meeting['start']
        },
        endTime: function () {
            return this.meeting['end']
        },
        getStyle: function () {
            if (this.style) {
                return this.style
            }
        },

        dataevent: function () {
            return this.meeting.event
        }

    },
    mounted: function () {
        let duration = this.getScheduleTimestamp(this.endTime) - this.getScheduleTimestamp(this.startTime);
        let timelineStart = this.getScheduleTimestamp('9:00');
        let start = this.getScheduleTimestamp(this.startTime);
        let timelineUnitDuration = this.getScheduleTimestamp('10:00') - timelineStart;
        let slotHeight = this.$parent.$refs.header.offsetHeight;
        let eventTop = slotHeight*(start - timelineStart)/timelineUnitDuration - 1 + 'px';
        let eventHeight = slotHeight*duration/timelineUnitDuration + 1 + 'px';
        let node = this.$parent.sectionTodayDone[this.meeting.meetingId];
        let eventWidth = 100/node.processorTotal;
        let eventLeft = eventWidth * (node.processor - 1) + '%';
        this.style = {'top': eventTop, 'height': eventHeight, 'width': eventWidth + "%", 'left': eventLeft};


    },
    methods: {
        getScheduleTimestamp: function (time) {
            //accepts hh:mm format - convert hh:mm to timestamp
            time = time.replace(/ /g,'');
            var timeArray = time.split(':');
            var timeStamp = parseInt(timeArray[0])*60 + parseInt(timeArray[1]);
            return timeStamp;
        },
        meetingClick: function () {
            this.$parent.$parent.openModal(this.courseCode);
            this.$parent.$parent.modalState.selectedMeeting = this
        },
        removeEventSelectedClass: function () {
            this.meetingClassList.splice(this.meetingClassList.indexOf('cd-schedule__event--selected'), 1);
        }
    },
    template: '<li :class="meetingClassList" :style="getStyle" v-on:click="meetingClick">' +
        '<a :data-start="this.startTime" :data-end="this.endTime" data-content="event-yoga-1" :data-event="this.dataevent" href="#0">' +
        '<em class="cd-schedule__name">{{this.courseCode}}</em>'+
        '<em class="cd-schedule__name">{{this.courseTitle}}</em>'+
        '</a></li>',

});

Vue.component('day', {
    props: ['semester', 'day', 'dayshort', 'sectionToday'],
    computed: {
        header: function () {
            return this.semester + "|" + this.day
        },
        sectionTodayDone: function () {
            let meetings = [];
            for (let i=0;i<this.sectionToday.length;i++){
                let meeting = this.sectionToday[i];
                meetings.push(new Node(meeting.start, meeting.end, meeting.meetingId))
            }
            result = {};
            meetings.forEach(node => {
                node.setConflictGroup(meetings);
                delete node.conflictGroup;
                result[node.id] = node
            });
            return result

        }
    },
    template:
        "<li class=\"cd-schedule__group\">" +
        "          <div class=\"cd-schedule__top-info\" ref=header><span>{{this.day}}</span></div>" +
        "          <ul>" +
        "            <meeting v-for=\"meeting in sectionToday\" :meeting=\"meeting\"></meeting>" +
        "          </ul>" +
        "        </li>"
});


var timetable = new Vue({
    el: '.single-timetable',
    created() {
        window.addEventListener('resize', this.handleResize);
        this.handleResize();
    },
    destroyed() {
        window.removeEventListener('resize', this.handleResize)
    },
    data: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        daysshort: ['MO','TU','WE', "TH", "FR"],
        selections: {'VIC001Y1-Y-20199':['TUT-0101']},
        modalState: {
            selectedMeeting: undefined,
            currentModalEvent: {},
            modalIsOpening: false,
            modalIsClosing: false,
        },
        window: {
            width: 0,
            height: 0
        },
        courses:
            {"VIC001Y1-Y-20199": {
                    "courseTitle": "Vic One Plenary",
                    "code": "VIC001Y1",
                    "courseDescription": "desctest",
                    "prerequisite": "",
                    "corequisite": "asdf",
                    "exclusion": "",
                    "section": "Y",
                    "meetings": {
                        "LEC-0101": {
                            "schedule": {
                                "WE-163117": {
                                    "meetingDay": "WE",
                                    "meetingStartTime": "16:00",
                                    "meetingEndTime": "18:00",
                                    "meetingScheduleId": "163117",
                                    "assignedRoom1": "",
                                    "assignedRoom2": ""
                                }
                            },
                            "instructors": ['b'],
                            "teachingMethod": "LEC",

                        },
                        "TUT-0101": {
                            "schedule": {
                                "MO-167659": {
                                    "meetingDay": "MO",
                                    "meetingStartTime": "10:00",
                                    "meetingEndTime": "13:00",
                                    "meetingScheduleId": "167659",
                                    "assignedRoom1": "",
                                    "assignedRoom2": ""
                                },
                                "TU-167660": {
                                    "meetingDay": "TU",
                                    "meetingStartTime": "10:00",
                                    "meetingEndTime": "13:00",
                                    "meetingScheduleId": "167660",
                                    "assignedRoom1": "",
                                    "assignedRoom2": ""
                                },
                                "TU-167668": {
                                    "meetingDay": "TU",
                                    "meetingStartTime": "12:00",
                                    "meetingEndTime": "14:00",
                                    "meetingScheduleId": "167668",
                                    "assignedRoom1": "",
                                    "assignedRoom2": ""
                                }
                            },
                            "instructors": ['a'],
                            "teachingMethod": "TUT",
                        },
                    },

                },

            }

    },
    computed: {
        // times is to build the timetable with proper time
        times: function () {
            let time_list = [];
            for (let h=9;h<22;h++){
                if (h === 9){
                    h = '09'
                }
                time_list.push(h + ":" + '00');
            }
            return time_list
        },
        // construct the courses info from selected courses
        allSelectedCourses: function () {
            let result = {};
            for (let i=0;i<Object.keys(this.selections).length;i++){
                let key = Object.keys(this.selections)[i];
                let values = this.selections[key];
                console.log(values)
                result[key] = {}
                values.forEach(value => {
                    result[key][value] = {}
                    result[key][value] = this.getCourseSectionInfo(key, value);
                    result[key][value]['event'] = 'event-' + i
                })
            }

            return result
        },
        sectionByDay: function () {
            let fall = {'MO': [], "TU": [], "WE": [], "TH": [], "FR": []};
            let winter = {'MO': [], "TU": [], "WE": [], "TH": [], "FR": []};
            let result = {'fall': fall, 'winter': winter};
            console.log(this.allSelectedCourses)
            for (let i=0; i<Object.keys(this.allSelectedCourses).length; i++) {
                let coursesInfos = Object.values(this.allSelectedCourses)[i];
                Object.keys(coursesInfos).forEach(sectionCode=> {
                    let courseInfo = coursesInfos[sectionCode]
                    let schedule = courseInfo['meetings']['schedule'];
                    for (let j=0;j<Object.keys(schedule).length;j++) {
                        let meeting = Object.values(schedule)[j];
                        let sectionInfoByDay = JSON.parse(JSON.stringify(courseInfo));
                        sectionInfoByDay['start'] = meeting.meetingStartTime;
                        sectionInfoByDay['end'] = meeting.meetingEndTime;
                        sectionInfoByDay['loc'] = meeting.assignedRoom1;
                        sectionInfoByDay['instructors'] = meeting.instructors;
                        sectionInfoByDay['meetingId'] = Object.keys(schedule)[j];
                        delete sectionInfoByDay.meetings;
                        if (courseInfo.section === 'Y' || courseInfo.section === 'F') {
                            result['fall'][meeting['meetingDay']].push(sectionInfoByDay)
                        }
                        if (courseInfo.section === 'Y' || courseInfo.section === 'S') {
                            result['winter'][meeting['meetingDay']].push(sectionInfoByDay)
                        }
                    }
                })
            }
            return result
        },
        hasSelectedMeeting: function () {
            return this.modalState.selectedMeeting !== undefined;
        }

    },
    methods: {
        handleResize() {
            this.window.width = window.innerWidth;
            this.window.height = window.innerHeight;
        },
        getCourseInfo: function (courseId) {
            // if statement let function accept both 'CSC108H1' or 'VIC001Y1-Y-20199'
            let result_course = null;
            if (this.courses[courseId]) {
                result_course = this.courses[courseId];
                result_course.keyCode = courseId
            } else {
                Object.keys(this.courses).forEach(key => {
                    let course = this.courses[key]
                    if (course.code === courseId) {
                        result_course = course
                        result_course.keyCode = key
                    }
                });
            }
            return JSON.parse(JSON.stringify(result_course))
        },
        getCourseSectionInfo: function (courseId, sectionId) {
            let course = this.getCourseInfo(courseId);
            course['meetings'] =  course['meetings'][sectionId];
            course.selectedSectionId = sectionId;
            return course
        },
        openModal: function (courseId) {
            this.modalState.currentModalEvent = this.getCourseInfo(courseId);
            this.modalState.modalIsOpening = true
        },
        closeModal: function () {
            this.modalState.selectedMeeting = undefined
            this.modalState.modalIsClosing = true
        },
        selectSection: function (courseID, sectionID) {
            if (!(courseID in this.selections)) {
                this.selections[courseID] = [sectionID]
            } else {
                this.selections[courseID].push(sectionID)
            }
        },
        unSelectSection: function (courseID, sectionID) {
            this.selections[courseID] = this.selections[courseID].filter(e => e !== sectionID)
            console.log(this.selections[courseID])
        }


    }
});









