import { CLASSES, PRL_STREAMS } from '../data/seedData';

const normalize = (value = '') => value.toLowerCase().trim();

export const lecturerMatchesUser = (lecturerName, userName = '') => {
  const lecturer = normalize(lecturerName);
  const user = normalize(userName);
  const surname = normalize(userName.split(' ').pop());

  return lecturer === user || (surname && lecturer.includes(surname));
};

export const getUserCourses = (user, courses) => {
  if (!user) return [];
  if (user.role === 'FMG') return courses;
  if (user.role === 'Lecturer') {
    return courses.filter(course => lecturerMatchesUser(course.lecturer, user.name));
  }
  if (user.role === 'Student') {
    return courses.filter(course => course.class === user.class);
  }
  if (user.role === 'PRL') {
    const stream = user.prlId ? PRL_STREAMS[user.prlId] : null;
    if (!stream) {
      return courses.filter(course => {
        const cls = CLASSES.find(entry => entry.code === course.class);
        return cls && cls.faculty === user.faculty;
      });
    }

    const allowedClassCodes = new Set(
      CLASSES.filter(cls => cls.faculty === stream.faculty && stream.programmes.includes(cls.programme)).map(cls => cls.code)
    );
    return courses.filter(course => allowedClassCodes.has(course.class));
  }

  return courses.filter(course => {
    const cls = CLASSES.find(entry => entry.code === course.class);
    return cls && cls.faculty === user.faculty;
  });
};

export const getUserClasses = (user, courses) => {
  if (!user) return [];
  if (user.role === 'FMG') return CLASSES;
  if (user.role === 'Student') {
    return CLASSES.filter(cls => cls.code === user.class);
  }
  if (user.role === 'Lecturer') {
    const myCourseClasses = new Set(getUserCourses(user, courses).map(course => course.class));
    return CLASSES.filter(cls => myCourseClasses.has(cls.code));
  }
  if (user.role === 'PRL') {
    const stream = user.prlId ? PRL_STREAMS[user.prlId] : null;
    if (!stream) {
      return CLASSES.filter(cls => cls.faculty === user.faculty);
    }
    return CLASSES.filter(cls => cls.faculty === stream.faculty && stream.programmes.includes(cls.programme));
  }

  return CLASSES.filter(cls => cls.faculty === user.faculty);
};
