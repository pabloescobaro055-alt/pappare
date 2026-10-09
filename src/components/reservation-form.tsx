"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";

type Status = "idle" | "loading" | "success" | "error";

const successMessage = "Спасибо! Заявка отправлена. Мы скоро свяжемся с вами.";
const errorMessage = "Не удалось отправить заявку. Пожалуйста, попробуйте позже или позвоните нам.";

const fields = [
  ["Имя *", "name", "text", true, "Иван"],
  ["Телефон *", "phone", "tel", true, "+7 999 123-45-67"],
  ["Удобное время", "time", "text", false, "20 июня, 19:00"],
  ["Количество персон", "guests", "number", false, "2"],
] as const;

export function ReservationForm({ dark = false }: { dark?: boolean }) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [token,setToken]=useState(''),[ready,setReady]=useState(false);
  async function prepareForm(){setReady(false);const response=await fetch('/api/reservations',{cache:'no-store'});const data=await response.json();if(!response.ok||!data.token)throw new Error(data.message||errorMessage);setToken(data.token);return data.token as string;}
  useEffect(()=>{let live=true;let timer:ReturnType<typeof setTimeout>;void prepareForm().then(value=>{if(live)timer=setTimeout(()=>{if(live)setReady(true);},Math.max(0,2600-(Date.now()-Number(value.split('.')[0]))));}).catch(e=>{if(live){setStatus('error');setMessage(e.message);}});return()=>{live=false;clearTimeout(timer);};},[]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    if(!ready||status==='loading')return;

    setStatus("loading");
    setMessage("");

    const form = new FormData(formElement);
    const payload = {
      name: String(form.get("name") || ""),
      phone: String(form.get("phone") || ""),
      time: String(form.get("time") || ""),
      guests: String(form.get("guests") || ""),
      comment: String(form.get("comment") || ""),
      company: String(form.get("company") || ""),
      submittedAt:Number(token.split('.')[0]),
      formToken:token,
    };

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.ok) {
        if(response.status===403||response.status===429)setReady(false);
        throw new Error(data?.message||errorMessage);
      }

      setStatus("success");
      setMessage(successMessage);
      formElement.reset();
      setReady(false);
    } catch (error) {
      setStatus("error");
      setMessage((error as Error).message||errorMessage);
    }
  }

  const label = dark ? "text-cream/72" : "text-ink/70";
  const input = dark
    ? "border-cream/16 bg-cream/10 text-cream placeholder:text-cream/42 focus:border-amber"
    : "border-walnut/15 bg-cream text-ink placeholder:text-ink/35 focus:border-clay";

  return (
    <form
      onSubmit={onSubmit}
      className={`grid gap-3 rounded-lg p-4 md:grid-cols-2 md:gap-4 md:p-8 ${
        dark ? "border border-cream/12 bg-cream/8 backdrop-blur" : "bg-linen/55 shadow-soft"
      }`}
    >
      <input className="hidden" tabIndex={-1} autoComplete="off" name="company" />
      {fields.map(([labelText, name, type, required, placeholder]) => (
        <label key={name} className={`grid gap-2 text-sm ${label}`}>
          {labelText}
          <input
            name={name}
            type={type}
            required={required}
            minLength={name==='name'?2:name==='phone'?10:undefined}
            maxLength={name==='name'||name==='time'?80:name==='phone'?24:undefined}
            placeholder={placeholder}
            min={type === "number" ? 1 : undefined}
            max={type === "number" ? 30 : undefined}
            className={`h-11 rounded-full border px-5 outline-none transition md:h-12 ${input}`}
          />
        </label>
      ))}
      <label className={`grid gap-2 text-sm ${label} md:col-span-2`}>
        Комментарий
        <textarea
          name="comment"
          maxLength={500}
          placeholder="Столик у окна"
          className={`min-h-20 rounded-lg border px-5 py-3 outline-none transition md:min-h-24 md:py-4 ${input}`}
        />
      </label>
      <Button disabled={status === "loading"||!ready} variant="warm" className="md:col-span-2">
        <CalendarDays size={18} />
        {status === "loading" ? "Отправляем..." : "Отправить заявку"}
      </Button>
      {status==='success'&&<p className="md:col-span-2">Не отправляйте повторную заявку — администратор свяжется с вами.</p>}
      {status==='error'&&!ready&&<button type="button" onClick={()=>{setMessage('');void prepareForm().then(()=>{setTimeout(()=>{setReady(true);setStatus('idle');},2600);}).catch(e=>setMessage(e.message));}}>Обновить форму</button>}
      {message ? (
        <p
          className={`md:col-span-2 ${
            status === "success" ? "text-olive" : dark ? "text-amber" : "text-clay"
          }`}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
