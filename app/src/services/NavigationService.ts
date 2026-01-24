import { createNavigationContainerRef, StackActions } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

/**
 * Navigate to a specific route
 */
export function navigate(name: string, params?: any) {
    if (navigationRef.isReady()) {
        // @ts-ignore
        navigationRef.navigate(name, params);
    }
}

/**
 * Replace the current route
 */
export function replace(name: string, params?: any) {
    if (navigationRef.isReady()) {
        navigationRef.dispatch(StackActions.replace(name, params));
    }
}

/**
 * Reset navigation state
 */
export function reset(routeName: string, params?: any) {
    if (navigationRef.isReady()) {
        navigationRef.reset({
            index: 0,
            routes: [{ name: routeName, params }],
        });
    }
}

/**
 * Go back to previous screen
 */
export function goBack() {
    if (navigationRef.isReady()) {
        navigationRef.goBack();
    }
}

export default {
    navigate,
    replace,
    reset,
    goBack,
};
