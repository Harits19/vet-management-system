"use client";

import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Typography,
  Input,
  Checkbox,
  Button,
} from "@material-tailwind/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { FormEvent, useState, useEffect } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

const LoginForm = () => {
  const [email, setEmail] = useState("admin@gmail.com");
  const [password, setPassword] = useState("admin@12345678");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const router = useRouter();
  const params = useSearchParams();
  const query = params?.get("callbackUrl");

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          credentials: "include",
        });

        if (response.ok) {
          router.replace(query ? query.toString() : "/dashboard");
          return;
        }
      } catch (_error) {
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, [router, query]);

  const handleShowPass = () => setShowPass((prev) => !prev);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Login gagal.", {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
        return;
      }

      router.replace(query ? query.toString() : "/dashboard");
    } catch (_error) {
      toast.error("Tidak dapat terhubung ke server login.", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex flex-col justify-center items-center flex-1 text-2xl">
        Redirecting...
      </div>
    );
  }

  return (
    <Card color="white" className="px-4 pb-2 max-w-sm w-full shadow-blue-300">
      <CardHeader
        variant="gradient"
        color="blue"
        className="mb-4 grid h-28 place-items-center"
      >
        <Typography variant="h3" color="white">
          Sign In
        </Typography>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardBody className="flex flex-col gap-4">
          <Input
            crossOrigin={""}
            label="Email"
            size="lg"
            color="blue"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            crossOrigin={""}
            label="Password"
            type={`${showPass ? "text" : "password"}`}
            size="lg"
            color="blue"
            icon={
              showPass ? (
                <EyeIcon
                  onClick={handleShowPass}
                  className="h-5 w-5 text-blue-500 cursor-pointer"
                />
              ) : (
                <EyeSlashIcon
                  onClick={handleShowPass}
                  className="h-5 w-5 cursor-pointer"
                />
              )
            }
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="-ml-2.5">
            <Checkbox crossOrigin={""} label="Remember Me" color="blue" />
          </div>
        </CardBody>

        <CardFooter className="pt-0">
          <Button
            type="submit"
            variant="gradient"
            fullWidth
            color="blue"
            disabled={loading}
          >
            Sign In
          </Button>
          <Typography variant="small" className="mt-6 flex justify-center">
            Don&apos;t have an account?
            <Typography
              as={Link}
              href="/signup"
              variant="small"
              color="blue"
              className="ml-1 font-bold"
            >
              Sign up
            </Typography>
          </Typography>
        </CardFooter>
      </form>
    </Card>
  );
};

export default LoginForm;
