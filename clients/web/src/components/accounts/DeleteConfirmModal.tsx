"use client";

import React from "react";
import { GravAccount } from "@/types/gravwatch";
import { useGravWatch } from "@/context/GravWatchContext";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Paper from "@mui/material/Paper";
import DeleteIcon from "@mui/icons-material/Delete";

interface DeleteConfirmModalProps {
  account: GravAccount | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  account,
  isOpen,
  onClose,
}) => {
  const { deleteAccount } = useGravWatch();

  if (!account) return null;

  // ==========================================================================
  // TODO: [BACKEND INTEGRATION] - Container Teardown & Permanent Deletion API
  //
  // 1. Current Client-Side Behavior:
  //    - Removes account from local state array.
  //
  // 2. Required Backend Endpoint & Query Params:
  //    - `DELETE http://localhost:8000/api/v1/accounts/{account.id}?purge_volume=true&graceful_timeout=15`
  //
  // 3. Backend Execution Pipeline:
  //    - 1. Graceful Drain: Stops routing new prompts to this account; awaits completion of in-flight executions.
  //    - 2. Container Teardown: Executes `docker stop {container} && docker rm -v {container}`.
  //    - 3. Volume Purge: Deletes isolated OAuth session directory `./data/acc-XX/`.
  //    - 4. Database Cleanup: Deletes or archives account record, updates cluster capacity pool, and emits WebSocket event.
  //
  // 4. Edge Cases:
  //    - [ ] Active In-Flight Executions: If an `agy` task is actively generating code, return 409 Conflict unless `force=true` is passed.
  //    - [ ] Locked Volume Directory: Handle file lock errors on Windows/Linux host mounts gracefully with retry logic.
  // ==========================================================================
  const handleDelete = () => {
    deleteAccount(account.id);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="xs"
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
      <DialogTitle sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.75, sm: 2 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar sx={{ bgcolor: "rgba(244, 63, 94, 0.15)", color: "error.main", width: 34, height: 34, flexShrink: 0 }}>
            <DeleteIcon sx={{ fontSize: 20 }} />
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#ffffff", fontSize: { xs: "0.92rem", sm: "1.05rem" }, lineHeight: 1.3 }}>
              Delete Account Sandbox
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", fontSize: { xs: "0.7rem", sm: "0.75rem" }, display: "block" }}>
              Permanent deletion of container and session tokens
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ borderColor: "rgba(255, 255, 255, 0.08)", px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 2.5 }, overflowY: "auto" }}>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2, fontSize: { xs: "0.82rem", sm: "0.875rem" }, wordBreak: "break-word" }}>
          Are you sure you want to remove <strong>{account.alias}</strong> ({account.email})?
        </Typography>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            border: "1px solid rgba(244, 63, 94, 0.2)",
            backgroundColor: "rgba(244, 63, 94, 0.05)",
            borderRadius: 2,
            fontFamily: "monospace",
            fontSize: { xs: "0.7rem", sm: "0.75rem" },
          }}
        >
          <Box sx={{ color: "error.main", fontWeight: 700, mb: 0.5 }}>⚠️ Irreversible Action:</Box>
          <Box sx={{ color: "text.secondary" }}>• Docker container {account.containerName} will be stopped & pruned.</Box>
          <Box sx={{ color: "text.secondary" }}>• Quota capacity will be deducted from the pooled telemetry.</Box>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 1.75 }, gap: 1.25, borderTop: "1px solid rgba(255, 255, 255, 0.08)", backgroundColor: "rgba(9, 13, 22, 0.95)" }}>
        <Button variant="outlined" size="small" onClick={onClose} sx={{ borderColor: "rgba(255, 255, 255, 0.15)", color: "#cbd5e1" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          size="small"
          color="error"
          onClick={handleDelete}
          sx={{ fontWeight: 700 }}
        >
          Confirm Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};
