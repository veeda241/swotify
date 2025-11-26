import { User, Achievement, ClassGroup, SystemLog, UserRole } from '../types';

// Mock Data Store
const MOCK_USERS: User[] = [
  { id: 'dev1', username: 'dev', name: 'Alex Developer', role: 'SUPER_ADMIN' },
  { id: 'admin1', username: 'principal', name: 'Principal Skinner', role: 'ADMIN' },
  { id: 'teacher1', username: 'msts', name: 'Mrs. Krabappel', role: 'TEACHER' },
  { id: 'student1', username: 'bart', name: 'Bart Simpson', role: 'STUDENT', classId: 'class1' },
  { id: 'student2', username: 'lisa', name: 'Lisa Simpson', role: 'STUDENT', classId: 'class1' },
];

const MOCK_CLASSES: ClassGroup[] = [
  { id: 'class1', name: 'Grade 4-A', teacherId: 'teacher1' },
];

let MOCK_ACHIEVEMENTS: Achievement[] = [
  { id: '1', studentId: 'student1', title: 'Math Quiz', date: '2023-10-15', score: 65, maxScore: 100, type: 'Academic', description: 'Fractions and decimals' },
  { id: '2', studentId: 'student1', title: 'Science Project', date: '2023-10-20', score: 70, maxScore: 100, type: 'Academic', description: 'Volcano model' },
  { id: '3', studentId: 'student2', title: 'Math Quiz', date: '2023-10-15', score: 98, maxScore: 100, type: 'Academic', description: 'Fractions and decimals' },
  { id: '4', studentId: 'student2', title: 'History Essay', date: '2023-10-22', score: 95, maxScore: 100, type: 'Academic', description: 'Local history' },
];

let MOCK_LOGS: SystemLog[] = [
  { id: '1', timestamp: new Date().toISOString(), level: 'INFO', message: 'System initialized', source: 'System' },
  { id: '2', timestamp: new Date().toISOString(), level: 'WARN', message: 'High latency detected in audio stream', source: 'AudioService' },
];

export const DataService = {
  login: (role: UserRole) => {
    return MOCK_USERS.find(u => u.role === role) || MOCK_USERS[0];
  },

  getUsers: () => MOCK_USERS,
  
  getClasses: () => MOCK_CLASSES,

  getStudentsByTeacher: (teacherId: string) => {
    const teacherClass = MOCK_CLASSES.find(c => c.teacherId === teacherId);
    if (!teacherClass) return [];
    return MOCK_USERS.filter(u => u.role === 'STUDENT' && u.classId === teacherClass.id);
  },

  getAllStudents: () => {
    return MOCK_USERS.filter(u => u.role === 'STUDENT');
  },

  getAchievements: (studentId: string) => {
    return MOCK_ACHIEVEMENTS.filter(a => a.studentId === studentId);
  },

  addAchievement: (achievement: Omit<Achievement, 'id'>) => {
    const newAchievement = { ...achievement, id: Date.now().toString() };
    MOCK_ACHIEVEMENTS = [...MOCK_ACHIEVEMENTS, newAchievement];
    DataService.log('INFO', `Achievement added for student ${achievement.studentId}`, 'TeacherAction');
    return newAchievement;
  },

  getLogs: () => MOCK_LOGS,

  log: (level: 'INFO' | 'WARN' | 'ERROR', message: string, source: string) => {
    const newLog: SystemLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      level,
      message,
      source
    };
    MOCK_LOGS = [newLog, ...MOCK_LOGS];
  },

  // Helper to generate context for AI
  getContextForUser: (user: User): string => {
    if (user.role === 'STUDENT') {
      const achievements = DataService.getAchievements(user.id);
      return `Student Context: ${user.name}. Recent Achievements: ${JSON.stringify(achievements)}.`;
    }
    if (user.role === 'TEACHER') {
      const students = DataService.getStudentsByTeacher(user.id);
      const studentData = students.map(s => ({
        name: s.name,
        achievements: DataService.getAchievements(s.id)
      }));
      return `Teacher Context: ${user.name}. Class Data: ${JSON.stringify(studentData)}.`;
    }
    if (user.role === 'ADMIN') {
      const allStudents = DataService.getAllStudents();
      return `Admin Context. Total Students: ${allStudents.length}. School Overview Data Available.`;
    }
    if (user.role === 'SUPER_ADMIN') {
      return `Super Admin Context. System Logs: ${JSON.stringify(MOCK_LOGS.slice(0, 5))}`;
    }
    return 'No context available.';
  }
};
