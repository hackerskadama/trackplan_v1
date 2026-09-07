/**
 * TrackPlan - Initial Sample Data & Storage Helper
 * Menyediakan data awal yang realistis dan fungsi penyimpanan lokal
 */

const STORAGE_KEYS = {
    GOALS: 'trackplan_goals_v1',
    PLANS: 'trackplan_plans_v1',
    SETTINGS: 'trackplan_settings_v1',
    STREAK: 'trackplan_streak_v1'
};

// Data Target & Rencana Bersih (Awal Bersih, Siap Digunakan Pengguna)
const DEFAULT_GOALS = [];
const DEFAULT_PLANS = [];

// Data Storage Functions
const StorageService = {
    getGoals() {
        // Otomatis bersihkan data demo awal agar aplikasi mulai bersih
        if (!localStorage.getItem('trackplan_cleaned_demo_v2')) {
            localStorage.removeItem(STORAGE_KEYS.GOALS);
            localStorage.removeItem(STORAGE_KEYS.PLANS);
            localStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify({ count: 0, lastCompletedDate: null }));
            localStorage.setItem('trackplan_cleaned_demo_v2', 'true');
            return [];
        }
        const data = localStorage.getItem(STORAGE_KEYS.GOALS);
        if (!data) {
            this.saveGoals(DEFAULT_GOALS);
            return DEFAULT_GOALS;
        }
        try {
            return JSON.parse(data);
        } catch (e) {
            return DEFAULT_GOALS;
        }
    },

    saveGoals(goals) {
        localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    },

    getPlans() {
        const data = localStorage.getItem(STORAGE_KEYS.PLANS);
        if (!data) {
            this.savePlans(DEFAULT_PLANS);
            return DEFAULT_PLANS;
        }
        try {
            return JSON.parse(data);
        } catch (e) {
            return DEFAULT_PLANS;
        }
    },

    savePlans(plans) {
        localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(plans));
    },

    getStreak() {
        const data = localStorage.getItem(STORAGE_KEYS.STREAK);
        if (!data) {
            const initialStreak = { count: 0, lastCompletedDate: null };
            localStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(initialStreak));
            return initialStreak;
        }
        try {
            return JSON.parse(data);
        } catch (e) {
            return { count: 0, lastCompletedDate: null };
        }
    },

    updateStreak() {
        const today = new Date().toISOString().split('T')[0];
        const streak = this.getStreak();
        if (streak.lastCompletedDate !== today) {
            streak.count += 1;
            streak.lastCompletedDate = today;
            localStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(streak));
        }
        return streak;
    },

    resetAllData() {
        localStorage.removeItem(STORAGE_KEYS.GOALS);
        localStorage.removeItem(STORAGE_KEYS.PLANS);
        localStorage.removeItem(STORAGE_KEYS.STREAK);
        return {
            goals: this.getGoals(),
            plans: this.getPlans(),
            streak: this.getStreak()
        };
    }
};

// Kutipan Motivasi Harian (Indonesian Quotes)
const MOTIVATIONAL_QUOTES = [
    { text: "Langkah kecil setiap hari membawa perubahan besar pada masa depanmu.", author: "Pepatah Produktif" },
    { text: "Disiplin adalah jembatan antara tujuan dan pencapaian nyata.", author: "Jim Rohn" },
    { text: "Jangan hitung hari yang berlalu, buatlah setiap harinya berarti.", author: "Muhammad Ali" },
    { text: "Fokus pada progres, bukan pada kesempurnaan.", author: "Mindset Sukses" },
    { text: "Masa depanmu diciptakan oleh apa yang kamu lakukan hari ini, bukan besok.", author: "Robert Kiyosaki" }
];
