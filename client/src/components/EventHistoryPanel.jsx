import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/toast";
import { format, formatDistanceToNow } from "date-fns";
import { Clock, AlertCircle } from "lucide-react";
import apiClient from "@/utils/apiClient";

export default function EventHistoryPanel({ eventId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/api/event/${eventId}/history`);
        const data = response.data;
        setHistory(data.history || []);
      } catch (error) {
        console.error("Error fetching event history:", error);
        toast({
          title: "Error",
          description: "Failed to load event history",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchHistory();
    }
  }, [eventId, toast]);

  const getActionDescription = (item) => {
    const meta =
      typeof item.meta === "string" ? JSON.parse(item.meta) : item.meta;

    const blue = (text) => (
      <span className="text-blue-600 font-medium">{text}</span>
    );

    switch (item.edit_type) {
      case "event_created":
        return <>Created event {blue(`"${item.new_value}"`)}</>;
      case "name_updated":
        return (
          <>
            Changed name from {blue(`"${item.old_value || "None"}"`)} to{" "}
            {blue(`"${item.new_value}"`)}
          </>
        );
      case "location_updated":
        return (
          <>
            Changed location from {blue(`"${item.old_value || "None"}"`)} to{" "}
            {blue(`"${item.new_value || "None"}"`)}{" "}
          </>
        );
      case "date_updated":
        return <>Changed date to {blue(meta?.formatted || item.new_value)}</>;
      case "status_updated":
        return (
          <>
            Changed status from {blue(`"${item.old_value}"`)} to{" "}
            {blue(`"${item.new_value}"`)}
          </>
        );
      case "donor_status_updated":
        return (
          <>
            Changed status of {blue(meta?.donorName || "a donor")} from{" "}
            {blue(`"${item.old_value}"`)} to {blue(`"${item.new_value}"`)}
            {item.new_value === "declined" && meta?.declineReason && (
              <>
                {" "}
                with reason:{" "}
                <span className="italic text-muted-foreground">
                  "{meta.declineReason}"
                </span>
              </>
            )}
          </>
        );

      case "donor_added_bulk":
        return <>{blue(item.new_value)}</>;
      case "donor_removed_bulk":
        return <>{blue(item.old_value)}</>;
      case "donor_initialized":
        return <>Added {blue(item.new_value)}</>;
      case "collaborator_added":
        return <>Added collaborator {meta?.username && blue(meta.username)}</>;
      case "collaborator_removed":
        return (
          <>Removed collaborator {meta?.username && blue(meta.username)}</>
        );
      default:
        return <>{item.edit_type.replace(/_/g, " ")}</>;
      case "capacity_updated":
        return (
          <>
            Changed capacity from {blue(`"${item.old_value || "None"}"`)} to{" "}
            {blue(`"${item.new_value || "None"}"`)}
          </>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Event History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <p className="text-muted-foreground">Loading history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No history available</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {history.map((item, index) => (
                <div key={item.id || index} className="relative">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <Avatar className="h-8 w-8">
                        {item.editor?.avatar ? (
                          <AvatarImage src={item.editor.avatar} />
                        ) : (
                          <AvatarFallback>
                            {item.editor?.username?.[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      {index !== history.length - 1 && (
                        <div className="w-0.5 bg-gray-200 grow mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {item.editor?.username || `User #${item.editor_id}`}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(item.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <p className="text-sm mt-1">
                          {getActionDescription(item)}
                        </p>
                        <span className="text-xs text-muted-foreground mt-1">
                          {format(
                            new Date(item.created_at),
                            "MMM d, yyyy 'at' h:mm a"
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  {index !== history.length - 1 && <div className="h-4"></div>}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
