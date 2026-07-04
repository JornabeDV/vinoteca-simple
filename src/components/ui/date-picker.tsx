"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  id?: string;
  date?: string;
  onChange?: (date: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DatePicker({
  id,
  date,
  onChange,
  placeholder = "Seleccionar fecha",
  disabled,
  className,
}: DatePickerProps) {
  const selectedDate = date ? new Date(date + "T00:00:00") : undefined;

  return (
    <Popover>
      <div className="h-10 leading-none">
        <PopoverTrigger
          render={
            <Button
              id={id}
              variant="outline"
              className={cn(
                "w-full h-full justify-start text-left font-normal bg-background",
                !date && "text-muted-foreground",
                className
              )}
              disabled={disabled}
            />
          }
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {date && selectedDate
            ? format(selectedDate, "dd/MM/yyyy", { locale: es })
            : placeholder}
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(day) => {
            if (day) {
              const yyyy = day.getFullYear();
              const mm = String(day.getMonth() + 1).padStart(2, "0");
              const dd = String(day.getDate()).padStart(2, "0");
              onChange?.(`${yyyy}-${mm}-${dd}`);
            }
          }}
          locale={es}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
