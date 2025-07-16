import { useEffect, useRef, useState } from "react";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { type NoteForm } from "~/schemas/notes";

interface NoteFormProps {
  defaultValues?: Partial<NoteForm>;
  onSuccess?: () => void;
}

export function NoteForm({ defaultValues = {}, onSuccess }: NoteFormProps) {
  const actionData = useActionData<{
    success: boolean;
    errors?: Record<string, string[]>;
  }>();
  const navigation = useNavigation();
  const formRef = useRef<HTMLFormElement>(null);
  const [submitted, setSubmitted] = useState(false);

  const isSubmitting = navigation.state === "submitting";

  useEffect(() => {
    if (actionData?.success && submitted) {
      formRef.current?.reset();
      onSuccess?.();
    }
  }, [actionData?.success, submitted, onSuccess]);

  return (
    <Form ref={formRef} method="post" className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          defaultValue={defaultValues.title}
          required
          maxLength={255}
          aria-invalid={actionData?.errors?.title ? true : undefined}
          aria-errormessage={actionData?.errors?.title?.join(", ")}
        />
        {actionData?.errors?.title && (
          <p className="text-sm text-red-500" id="title-error">
            {actionData.errors.title.join(", ")}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={defaultValues.description}
          required
          rows={5}
          maxLength={10000}
          placeholder="Write your note here..."
          aria-invalid={actionData?.errors?.description ? true : undefined}
          aria-errormessage={actionData?.errors?.description?.join(", ")}
        />
        {actionData?.errors?.description && (
          <p className="text-sm text-red-500" id="description-error">
            {actionData.errors.description.join(", ")}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} onClick={() => setSubmitted(true)}>
        {isSubmitting ? "Saving..." : "Save Note"}
      </Button>
    </Form>
  );
}
