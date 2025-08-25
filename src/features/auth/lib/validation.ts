import * as yup from "yup";

export const loginSchema = yup.object({
    email: yup.string().email("Некорректный email").required("Введите email"),
    password: yup.string().min(6, "Минимум 6 символов").required("Введите пароль"),
});

export const registerSchema = loginSchema.shape({
    confirmPassword: yup
        .string()
        .oneOf([yup.ref("password")], "Пароли должны совпадать")
        .required("Повторите пароль"),
});
