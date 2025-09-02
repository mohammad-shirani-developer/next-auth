"use client";

import Phone from "@/app/_assets/phone";
import { Button } from "@/app/_components/button";
import { Loading } from "@/app/_components/loading";
import { TextBox } from "@/app/_components/textbox";
import { valibotResolver } from "@hookform/resolvers/valibot";
import Link from "next/link";
import { useRouter } from "next/router";
import { FC, useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";

const getTwoMinutesFromNow = () => {
  const time = new Date();
  time.setSeconds(time.getSeconds() + 120);
  return time;
};

type Props = {
  mobile: string;
  callbackUrl?: string;
};

export const VerificationForm: FC<Props> = ({ mobile, callbackUrl }) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<VerificationModel>({
    resolver: valibotResolver(VerificationSchema),
  });

  const [isPending, startTransition] = useTransition();
  const [isPendingSendAuthCode, startTransitionForSendAuth] = useTransition();
  const router = useRouter();
  const [showResendCode, setShowResendCode] = useState(false);
  const [expiryTimestamp, setExpiryTimestamp] = useState<Date | null>(null);

  useEffect(() => {
    if (showResendCode === false) {
      setExpiryTimestamp(getTwoMinutesFromNow());
    }
  }, [showResendCode]);
  const showNotification = useNotificationStore(
    (state) => state.showNotification
  );
  const authCodeRef = useRef<TimerRef>(null!);

  useEffect(() => {
    if ("OTPCredential" in window) {
      const ac = new AbortController();
      (navigator.credentials.get as any)({
        otp: { transport: ["sms"] },
        signal: ac.signal,
      })
        .then((otp: any) => {
          setValue("code", otp.code);
          handleSubmit(onSubmit)();
        })
        .catch((err: any) => {
          console.error("WebOTP API failed: ", err);
        });
      // Clean up if the component unmounts
      return () => ac.abort();
    }
  });

  const { update } = useSession();

  const onTimerExpired = () => {
    setShowResendCode(true);
  };

  const resendAuthCode = () => {
    startTransitionForSendAuth(async () => {
      const response = await sendAuthCodeAction({ mobile, acceptTerms: true });
      if (response.isSuccess) {
        authCodeRef.current?.restart(getTwoMinutesFromNow());
        setShowResendCode(false);
      }
    });
  };

  const onSubmit = async (data: VerificationModel) => {
    startTransition(async () => {
      const response = await verifyAction(data);
      if (response.isSuccess) {
        router.push(callbackUrl ? callbackUrl : "/courses");
        setShowResendCode(false);
        update();
        const fetchSession = async () => await getSession();
        fetchSession().then((session) => {
          if (session) startSignalRConnection(session?.user.accessToken);
        });

        if (!callbackUrl) {
          router.replace("/dashboard/courses");
        } else {
          router.replace(callbackUrl);
        }
      } else {
        showNotification({
          message: response.error.detail,
          type: "error",
          icon: <Message />,
        });
      }
    });
  };
  return (
    <div className="self-stretch">
      <h5 className="text-lg font-semibold  text-white">احراز هویت</h5>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-6 mt-6"
      >
        <TextBox
          name={"code"}
          autoComplete="one-time-code"
          type="number"
          extraNode={
            <div className="flex items-center gap-2 pr-4 border-r border-secondary-700">
              <SimpleTimer
                ref={authCodeRef}
                showDays={false}
                showHours={false}
                onExpire={onTimerExpired}
                className="w-10"
                expiryTimestamp={expiryTimestamp ?? getTwoMinutesFromNow()}
              />
              <Clock width={20} />
            </div>
          }
          register={register}
          errors={errors}
          description="کد باید 5 رقمی باشد"
          placeholder="کد تایید"
          label={`کد ارسال شده به شماره ${mobile} را وارد کنید`}
          icon={<Phone />}
        />
        <div className="flex items-center justify-between text-sm">
          <Link href="/signin">ویرایش شماره</Link>
          <Link
            className={`flex items-center  gap-2 relative ${
              showResendCode === false
                ? "text-secondary-600 pointer-events-none"
                : "text-white"
            }`}
            onClick={resendAuthCode}
            href={""}
          >
            {isPendingSendAuthCode && (
              <Loading
                text=""
                size="xs"
                className="absolute -right-3 top-0"
                color="primary"
              />
            )}
            ارسال مجدد کد
          </Link>
        </div>
        <input type="hidden" {...register("username")} value={mobile} />
        <Button type="submit" loading={isPending} className="w-full">
          ورود به کلاسبن
        </Button>
      </form>
    </div>
  );
};
