"use client";

import React, { useState, useEffect } from "react";
import { GravAccount, AntigravityPlan } from "@/types/gravwatch";
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
import EditIcon from "@mui/icons-material/Edit";
import { useLanguage } from "@/context/LanguageContext";

interface EditAccountModalProps {
  account: GravAccount | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditAccountModal: React.FC<EditAccountModalProps> = ({
  account,
  isOpen,
  onClose,
}) => {
  const { updateAccount } = useGravWatch();
  const { t } = useLanguage();

  const [alias, setAlias] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<AntigravityPlan>("Google AI Pro");
  const [status, setStatus] = useState<"active" | "warning" | "depleted" | "paused">("active");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (account) {
      setAlias(account.alias);
      setEmail(account.email);
      setPlan(account.plan);
      setStatus(account.status);
      setTags(account.tags.join(", "));
      setNotes(account.notes || "");
    }
  }, [account]);

  if (!account) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateAccount(account.id, {
      alias,
      email,
      plan,
      status,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      notes,
    });
    onClose();
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
            <Avatar sx={{ bgcolor: "rgba(139, 92, 246, 0.12)", color: "#8b5cf6", width: 34, height: 34, flexShrink: 0 }}>
              <EditIcon sx={{ fontSize: 20 }} />
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#ffffff", fontSize: { xs: "0.92rem", sm: "1.05rem" }, lineHeight: 1.3 }}>
                {t("accounts.editModal.title", { alias: account.alias })}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", fontSize: { xs: "0.7rem", sm: "0.75rem" }, display: "block" }}>
                {t("accounts.editModal.subtitle")}
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
              label={t("accounts.editModal.aliasLabel")}
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextField
                fullWidth
                size="small"
                label={t("accounts.editModal.emailLabel")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <FormControl fullWidth size="small">
                <InputLabel>{t("accounts.editModal.planLabel")}</InputLabel>
                <Select
                  value={plan}
                  label={t("accounts.editModal.planLabel")}
                  onChange={(e) => setPlan(e.target.value as AntigravityPlan)}
                >
                  <MenuItem value="Google AI Pro">Google AI Pro</MenuItem>
                  <MenuItem value="Google AI Ultra">Google AI Ultra</MenuItem>
                  <MenuItem value="Google AI Free">Google AI Free</MenuItem>
                  <MenuItem value="Enterprise">Enterprise</MenuItem>
                </Select>
              </FormControl>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormControl fullWidth size="small">
                <InputLabel>{t("accounts.editModal.statusLabel")}</InputLabel>
                <Select
                  value={status}
                  label={t("accounts.editModal.statusLabel")}
                  onChange={(e) => setStatus(e.target.value as any)}
                >
                  <MenuItem value="active">{t("common.active")}</MenuItem>
                  <MenuItem value="warning">{t("common.warning")}</MenuItem>
                  <MenuItem value="depleted">{t("common.depleted")}</MenuItem>
                  <MenuItem value="paused">{t("common.paused")}</MenuItem>
                </Select>
              </FormControl>
            </div>

            <TextField
              fullWidth
              size="small"
              label={t("accounts.editModal.tagsLabel")}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              size="small"
              label={t("accounts.editModal.notesLabel")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 1.75 }, gap: 1.25, borderTop: "1px solid rgba(255, 255, 255, 0.08)", backgroundColor: "rgba(9, 13, 22, 0.95)" }}>
          <Button variant="outlined" size="small" onClick={onClose} sx={{ borderColor: "rgba(255, 255, 255, 0.15)", color: "#cbd5e1" }}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            variant="contained"
            size="small"
            sx={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "#ffffff", fontWeight: 700 }}
          >
            {t("common.save")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
