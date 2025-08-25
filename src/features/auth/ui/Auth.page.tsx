import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
    Card, CardContent, Typography, TextField, Button, Box, Divider,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

import { useAuthFormStore } from "features/auth/model/useAuthFormStore";
import { loginSchema, registerSchema } from "features/auth/lib/validation";
import { firebaseService } from "app/firebase/firebase";

type LoginForm = { email: string; password: string; };
type RegisterForm = LoginForm & { confirmPassword: string; };

export const AuthPage = () => {
    const { isRegister, toggleMode } = useAuthFormStore();

    const schema = useMemo(() => (isRegister ? registerSchema : loginSchema), [isRegister]);

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<LoginForm | RegisterForm>({ resolver: yupResolver(schema) });

    const onSubmit = async (data: LoginForm | RegisterForm) => {
        try {
            if (isRegister) {
                const { email, password } = data as RegisterForm;
                await createUserWithEmailAndPassword(firebaseService.auth, email, password);
                // опционально: отправить verification email
                // if (firebaseService.auth.currentUser) await sendEmailVerification(firebaseService.auth.currentUser);
            } else {
                const { email, password } = data as LoginForm;
                await signInWithEmailAndPassword(firebaseService.auth, email, password);
            }
        } catch (e: any) {
            const msg = e?.message || "Ошибка аутентификации";
            setError("email" as any, { message: msg });
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(firebaseService.auth, provider);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Box display="flex" justifyContent="center" alignItems="center" minWidth="100vw" minHeight="100vh" >
            <Card sx={{ width: 400, p: 2 }}>
                <CardContent>
                    <Typography variant="h5" textAlign="center" gutterBottom>
                        {isRegister ? "Регистрация" : "Вход"}
                    </Typography>

                    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                        <TextField
                            fullWidth label="Email" type="email" margin="normal"
                            {...register("email" as const)}
                            error={!!errors.email} helperText={errors.email?.message as string}
                        />
                        <TextField
                            fullWidth label="Пароль" type="password" margin="normal"
                            {...register("password" as const)}
                            error={!!errors.password} helperText={errors.password?.message as string}
                        />
                        {isRegister && (
                            <TextField
                                fullWidth label="Повторите пароль" type="password" margin="normal"
                                {...register("confirmPassword" as const)}
                                error={'confirmPassword' in errors && !!errors.confirmPassword} helperText={'confirmPassword' in errors ? errors.confirmPassword?.message as string : null}
                            />
                        )}

                        <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }} disabled={isSubmitting}>
                            {isRegister ? "Зарегистрироваться" : "Войти"}
                        </Button>
                    </Box>

                    <Divider sx={{ my: 2 }}>или</Divider>

                    <Button fullWidth variant="outlined" startIcon={<GoogleIcon />} onClick={handleGoogleSignIn}>
                        Войти через Google
                    </Button>

                    <Box textAlign="center" mt={2}>
                        <Button onClick={toggleMode}>
                            {isRegister ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Зарегистрироваться"}
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};
