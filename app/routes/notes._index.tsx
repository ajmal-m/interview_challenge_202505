import {
  json,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@remix-run/node";
import { useLoaderData, useNavigation } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { NotesGrid } from "~/components/notes/notes-grid";
import { NoteForm } from "~/components/notes/note-form";
import { requireUserId } from "~/services/session.server";
import { createNote, getNotesByUserId } from "~/services/notes.server";
import { useState } from "react";
import { PlusIcon } from "@radix-ui/react-icons";
import { useNavigate } from "@remix-run/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "~/components/ui/page-header";
import { Separator } from "~/components/ui/separator";
import { noteSchema } from "~/schemas/notes";
import { NotesGridSkeleton } from "~/components/notes/note-skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination"

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const url = new URL(request.url);
  const page = url.searchParams.get("page") || 1;
  const limit = url.searchParams.get("limit") || 10;
  const { notes , totalPages} = await getNotesByUserId(userId, {page : Number(page) , limit: Number(limit) });
  return json({ notes, totalPages, page : Number(page) });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const formData = await request.formData();
  const data = {
    title: formData.get("title"),
    description: formData.get("description"),
  };

  const result = noteSchema.safeParse(data);

  if (!result.success) {
    return json(
      {
        success: false,
        errors: result.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  try {
    const note = await createNote({
      ...result.data,
      userId,
    });

    return json({ success: true, note });
  } catch (error) {
    console.error("Failed to create note:", error);
    return json({ error: "Failed to create note" }, { status: 500 });
  }
}

export default function NotesIndexPage() {
  const { notes , totalPages, page } = useLoaderData<typeof loader>();
  const [isOpen, setIsOpen] = useState(false);
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isLoading = navigation.state === "loading";
  // Reset the success handled flag when navigation change
  return (
    <div className="h-full min-h-screen bg-background">
      <div className="container px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="mx-auto space-y-8">
          <PageHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <PageHeaderHeading>Notes</PageHeaderHeading>
                <PageHeaderDescription>
                  Manage your notes and thoughts in one place.
                </PageHeaderDescription>
              </div>
              <Button
                onClick={() => {
                  setIsOpen(true);
                }}
                disabled={isLoading}
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Create Note
              </Button>
            </div>
          </PageHeader>

          <Separator />

          {isOpen ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Create Note</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </CardHeader>
              <CardContent>
                <NoteForm
                  onSuccess={() => {
                    setIsOpen(false);
                  }}
                />
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Your Notes</CardTitle>
              <CardDescription>
                A list of all your notes. Click on a note to view its details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? <NotesGridSkeleton /> : <NotesGrid notes={notes} />}
            </CardContent>
            {
              totalPages > 0 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        className={`${page === 1 ? 'pointer-events-none opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} 
                        onClick={() => navigate(`?page=${page-1}`) }
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext 
                        className={`${totalPages === page ? 'pointer-events-none opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        onClick={() => navigate(`?page=${page+1}`) }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )
            }
            {
              totalPages > 0 && (
              <CardContent className="text-center">
                Page {page} of {totalPages}
              </CardContent>
              )
            }
          </Card>
        </div>
      </div>
    </div>
  );
}
