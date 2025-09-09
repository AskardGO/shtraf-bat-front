import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
    Card, CardContent, Typography, TextField, Button, Box, Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import { useAuthFormStore } from "features/auth/model/useAuthFormStore";
import { useAuthStore } from "shared/stores/authStore";
import * as yup from "yup";

type LoginForm = { login: string; password: string; };
type RegisterForm = LoginForm & { confirmPassword: string; };

// Создаем схемы валидации для нашего backend
const loginSchema = yup.object({
    login: yup.string().required("Логин обязателен").min(3, "Логин должен содержать минимум 3 символа"),
    password: yup.string().required("Пароль обязателен").min(6, "Пароль должен содержать минимум 6 символов"),
});

const registerSchema = loginSchema.shape({
    confirmPassword: yup.string()
        .required("Подтверждение пароля обязательно")
        .oneOf([yup.ref("password")], "Пароли не совпадают"),
});

export const AuthPage = () => {
    const { isRegister, toggleMode } = useAuthFormStore();
    const { login, register: registerUser, loading } = useAuthStore();
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const schema = useMemo(() => (isRegister ? registerSchema : loginSchema), [isRegister]);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginForm | RegisterForm>({ resolver: yupResolver(schema) });

    const onSubmit = async (data: LoginForm | RegisterForm) => {
        try {
            setError(null);
            if (isRegister) {
                const { login: userLogin, password } = data as RegisterForm;
                await registerUser({ login: userLogin, password });
            } else {
                const { login: userLogin, password } = data as LoginForm;
                await login({ login: userLogin, password });
            }
            // После успешной авторизации перенаправляем на главную страницу
            navigate("/");
        } catch (e: any) {
            const msg = e?.response?.data?.error || e?.message || "Ошибка аутентификации";
            setError(msg);
        }
    };

    return (
        <Box display="flex" justifyContent="center" alignItems="center" minWidth="100vw" minHeight="100vh">
            <Card sx={{ width: 400, p: 2 }}>
                <CardContent>
                    <Typography variant="h5" textAlign="center" gutterBottom>
                        {isRegister ? "Регистрация" : "Вход"}
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                        <TextField
                            fullWidth 
                            label="Логин" 
                            margin="normal"
                            {...register("login")}
                            error={!!errors.login} 
                            helperText={errors.login?.message}
                        />
                        <TextField
                            fullWidth 
                            label="Пароль" 
                            type="password" 
                            margin="normal"
                            {...register("password")}
                            error={!!errors.password} 
                            helperText={errors.password?.message}
                        />
                        {isRegister && (
                            <TextField
                                fullWidth 
                                label="Повторите пароль" 
                                type="password" 
                                margin="normal"
                                {...register("confirmPassword")}
                                error={!!(errors as any).confirmPassword} 
                                helperText={(errors as any).confirmPassword?.message}
                            />
                        )}

                        <Button 
                            type="submit" 
                            fullWidth 
                            variant="contained" 
                            sx={{ mt: 2 }} 
                            disabled={isSubmitting || loading}
                        >
                            {isRegister ? "Зарегистрироваться" : "Войти"}
                        </Button>
                    </Box>

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
