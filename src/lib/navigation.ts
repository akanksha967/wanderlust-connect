export type ScreenType = 'login' | 'profile' | 'travel' | 'swipe' | 'chat' | 'account' | 'matches' | 'access' | 'admin';

export const pathToScreen: Record<string, ScreenType> = {
    '/login': 'login',
    '/profile': 'profile',
    '/travel': 'travel',
    '/swipe': 'swipe',
    '/matches': 'matches',
    '/chat': 'chat',
    '/account': 'account',
    '/admin': 'admin',
    '/access': 'access',
};

export const screenToPath: Record<ScreenType, string> = {
    login: '/login',
    profile: '/profile',
    travel: '/travel',
    swipe: '/swipe',
    matches: '/matches',
    chat: '/chat',
    account: '/account',
    admin: '/admin',
    access: '/access',
};
