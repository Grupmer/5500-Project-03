import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus } from "lucide-react";

export default function DonorList({
  donors,
  onToggle,
  getActionIcon = "add",
  sortOption,
}) {
  return (
    <ScrollArea className="h-[650px] border rounded-md">
      <div className="p-2 space-y-1">
        {donors.length === 0 ? (
          <div className="text-muted-foreground p-4 text-center">
            No donors to display.
          </div>
        ) : (
          donors.map((donor) => (
            <div
              key={donor.id || donor.value}
              className="flex justify-between items-center p-2 rounded-md hover:bg-muted"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {`${donor.first_name} ${donor.last_name}`}
                </div>

                <div className="flex items-center text-sm text-muted-foreground">
                  {donor.city && (
                    <span className="mr-2">
                      {donor.city.replace(/_/g, " ")}
                    </span>
                  )}
                  {donor.total_donation_amount > 0 && (
                    <span>
                      Total Donation: $
                      {donor.total_donation_amount.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* ✅ Show ML Score only if sortOption is "ml_score" */}
                {sortOption === "ml_score" &&
                  typeof donor.ml_score === "number" && (
                    <div className="text-sm mt-1 font-semibold text-green-600 flex items-center gap-1">
                      ML Score: {donor.ml_score.toFixed(2)}
                    </div>
                  )}

                {donor.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {donor.tags.map((tagItem, index) => {
                      const tag = tagItem.tag || tagItem;
                      const tagId = tag.id || tagItem.tag_id || index;
                      const tagName = tag.name || "";
                      const tagColor = tag.color || "#6366f1";

                      return (
                        <div
                          key={`${donor.id || donor.value}-${tagId}`}
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: tagColor,
                            color: getContrastColor(tagColor),
                          }}
                        >
                          {tagName}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onToggle(donor)}
                className="transition-colors hover:bg-primary/20"
              >
                {getActionIcon === "remove" ? (
                  <UserMinus className="h-4 w-4 text-red-600" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
}

function getContrastColor(hexColor) {
  if (!hexColor) return "#000000";

  hexColor = hexColor.replace("#", "");
  const r = parseInt(hexColor.substr(0, 2), 16);
  const g = parseInt(hexColor.substr(2, 2), 16);
  const b = parseInt(hexColor.substr(4, 2), 16);

  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#ffffff";
}
