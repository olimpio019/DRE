"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { WhatsAppButton } from "@/components/WhatsAppButton";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (status === "authenticated") {
      window.location.href = "/dashboard";
    }
  }, [status]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      console.log("Tentando fazer login com:", { email: data.email });
      
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      console.log("Resultado do login:", result);

      if (result?.error) {
        console.error("Erro durante o login:", result.error);
        alert(result.error);
        return;
      }

      if (result?.ok) {
        console.log("Login bem-sucedido, obtendo licença...");
        
        try {
          // Obter a licença ativa
          const response = await fetch("/api/licenses/active", {
            headers: {
              "Content-Type": "application/json",
              "x-licenca": localStorage.getItem("licenseKey") || "",
            },
          });

          if (!response.ok) {
            console.error("Erro ao obter licença:", response.status);
            throw new Error("Erro ao obter licença");
          }

          const { key } = await response.json();
          console.log("Licença obtida com sucesso");

          // Armazenar a chave da licença no localStorage
          localStorage.setItem("licenseKey", key);

          // Configurar o interceptador de requisições
          const originalFetch = window.fetch;
          window.fetch = async (input, init) => {
            const headers = new Headers(init?.headers);
            headers.set("x-licenca", key);
            return originalFetch(input, { ...init, headers });
          };

          console.log("Redirecionando para /admin");
          window.location.href = "/admin";
        } catch (error) {
          console.error("Erro ao processar licença:", error);
          // Não mostrar erro aqui, pois o login foi bem-sucedido
          window.location.href = "/admin";
        }
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      alert("Erro ao fazer login. Por favor, tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative"
      style={{
        backgroundImage: "url('/login-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Overlay para escurecer levemente o fundo */}
      <div className="absolute inset-0 bg-white bg-opacity-60 backdrop-blur-sm"></div>
      <div className="max-w-md w-full space-y-8 p-8 bg-white bg-opacity-90 rounded-lg shadow-lg relative z-10">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Faça login na sua conta
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                {...register("email")}
                type="email"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Senha
              </label>
              <input
                {...register("password")}
                type="password"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Senha"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </button>
          </div>
        </form>
      </div>
      <WhatsAppButton phoneNumber="5519993993659" />
    </div>
  );
} 