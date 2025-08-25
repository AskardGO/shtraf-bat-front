import { ReactNode, useEffect } from "react";
import { initFirebase} from "app/firebase/firebase.ts";
import { onAuthStateChanged } from "firebase/auth";
import { useAuthStore } from "features/auth";

type Props = {
    children: ReactNode;
};

export const FirebaseProvider = ({ children }: Props) => {
    const { setUser } = useAuthStore();

    useEffect(() => {
        const { auth } = initFirebase();

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
        });

        return () => unsubscribe();
    }, [setUser]);

    return <>{children}</>;
};
