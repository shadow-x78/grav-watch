"use client";

import React, { useState } from "react";
import { useGravWatch } from "@/context/GravWatchContext";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import { AntigravityPlan } from "@/types/gravwatch";

interface AddManualAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddManualAccountModal: React.FC<AddManualAccountModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addAccount } = useGravWatch();

  const [alias, setAlias] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<AntigravityPlan>("Google AI Pro");
  const [sessionToken, setSessionToken] = useState("");
  const [tags, setTags] = useState("Custom Node, Antigravity CLI");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alias) return;

    addAccount({
      alias,
      email: email || `${alias.toLowerCase().replace(/\s+/g, ".")}@antigravity.org`,
      plan,
      authType: "manual_token",
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      notes,
    });

    onClose();
    setAlias("");
    setEmail("");
    setSessionToken("");
    setNotes("");
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            backgroundColor: "#0d1322",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: { xs: 3, sm: 4 },
            m: { xs: 1.5, sm: 2 },
            maxHeight: { xs: "calc(100% - 24px)", sm: "calc(100% - 64px)" },
            display: "flex",
            flexDirection: "column",
          },
        },
      }}
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <DialogTitle sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.75, sm: 2 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar sx={{ bgcolor: "rgba(6, 182, 212, 0.12)", color: "secondary.main", width: 34, height: 34, flexShrink: 0 }}>
              <VpnKeyIcon sx={{ fontSize: 20 }} />
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#ffffff", fontSize: { xs: "0.92rem", sm: "1.05rem" }, lineHeight: 1.3 }}>
                Add Manual Account / Session Token
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", fontSize: { xs: "0.7rem", sm: "0.75rem" }, display: "block" }}>
                Configure a custom container node with explicit OAuth credentials and limits
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: "rgba(255, 255, 255, 0.08)", px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 2.5 }, overflowY: "auto" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              required
              fullWidth
              size="small"
              label="Account Alias"
              placeholder="e.g. Europe Heavy Node 04"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextField
                fullWidth
                size="small"
                label="Identifier Email"
                placeholder="developer@corp.net"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <FormControl fullWidth size="small">
                <InputLabel>Plan Tier</InputLabel>
                <Select
                  value={plan}
                  label="Plan Tier"
                  onChange={(e) => setPlan(e.target.value as AntigravityPlan)}
                >
                  <MenuItem value="Google AI Pro">Google AI Pro</MenuItem>
                  <MenuItem value="Google AI Ultra">Google AI Ultra</MenuItem>
                  <MenuItem value="Google AI Free">Google AI Free</MenuItem>
                  <MenuItem value="Enterprise">Enterprise</MenuItem>
                </Select>
              </FormControl>
            </div>

            <TextField
              fullWidth
              size="small"
              type="password"
              label="Session Token / Bearer Key (Optional)"
              placeholder="ya29.a0AfH6SM..."
              value={sessionToken}
              onChange={(e) => setSessionToken(e.target.value)}
              slotProps={{ htmlInput: { style: { fontFamily: "monospace" } } }}
            />

            <TextField
              fullWidth
              size="small"
              label="Tags (comma separated)"
              placeholder="Manual, Sandbox, Fast"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              size="small"
              label="Notes"
              placeholder="Details about this node..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 1.75 }, gap: 1.25, borderTop: "1px solid rgba(255, 255, 255, 0.08)", backgroundColor: "rgba(9, 13, 22, 0.95)" }}>
          <Button variant="outlined" size="small" onClick={onClose} sx={{ borderColor: "rgba(255, 255, 255, 0.15)", color: "#cbd5e1" }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            size="small"
            sx={{ background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)", color: "#ffffff", fontWeight: 700 }}
          >
            Create & Provision Node
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
