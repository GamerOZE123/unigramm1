import { useState } from "react";
import Layout from "@/components/layout/Layout";
import MobileHeader from "@/components/layout/MobileHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { useConfessions } from "@/hooks/useConfessions";
import { ConfessionCard } from "@/components/confessions/ConfessionCard";
import { CreateConfessionModal } from "@/components/confessions/CreateConfessionModal";
import { Button } from "@/components/ui/button";
import { Ghost, Plus } from "lucide-react";

export default function Confessions() {
  const isMobile = useIsMobile();
  const { confessions, loading, createConfession, toggleReaction, fetchComments, addComment } = useConfessions();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <Layout>
      {isMobile && <MobileHeader />}

      <div className="space-y-4 pt-4 px-4 max-w-2xl mx-auto pb-24">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ghost className="w-6 h-6 text-pink-400" />
            <h1 className="text-2xl font-bold text-foreground">Confessions</h1>
          </div>
          <Button onClick={() => setShowCreate(true)} size="sm" className="gap-1">
            <Plus className="w-4 h-4" />
            Confess
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Share anonymously. Tag people with @username.
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : confessions.length === 0 ? (
          <div className="text-center py-16">
            <Ghost className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No confessions yet</p>
            <p className="text-sm text-muted-foreground mt-1">Be the first to confess!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {confessions.map((c) => (
              <ConfessionCard
                key={c.id}
                confession={c}
                onReaction={toggleReaction}
                onFetchComments={fetchComments}
                onAddComment={addComment}
              />
            ))}
          </div>
        )}
      </div>

      <CreateConfessionModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={createConfession}
      />
    </Layout>
  );
}
