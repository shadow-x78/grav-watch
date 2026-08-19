"use client";

import React, { useState } from "react";
import { useGravWatch } from "@/context/GravWatchContext";
import { GravAccount } from "@/types/gravwatch";
import { AccountCard } from "./AccountCard";
import { AccountListItemCard } from "./AccountListItemCard";
import { GooglePairingModal } from "./GooglePairingModal";
import { AddManualAccountModal } from "./AddManualAccountModal";
import { EditAccountModal } from "./EditAccountModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputAdornment from "@mui/material/InputAdornment";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import Chip from "@mui/material/Chip";
import PeopleIcon from "@mui/icons-material/People";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import ViewListIcon from "@mui/icons-material/ViewList";
import GridViewIcon from "@mui/icons-material/GridView";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import KeyIcon from "@mui/icons-material/VpnKey";

export const AccountsTab: React.FC = () => {
  const { accounts, pooledTelemetry } = useGravWatch();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<GravAccount | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<GravAccount | null>(null);

  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch =
      acc.alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.containerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.plan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || acc.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeCount = accounts.filter((a) => a.status === "active").length;
  const warningCount = accounts.filter((a) => a.status === "warning" || a.status === "depleted").length;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <PeopleIcon sx={{ fontSize: 26, color: "primary.main" }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#ffffff" }}>
              Google Accounts & Sandboxes
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
            Manage isolated Docker containers, OAuth sessions, and monitor twin Antigravity quota tiers
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<KeyIcon />}
            onClick={() => setIsManualModalOpen(true)}
            sx={{
              borderColor: "rgba(255, 255, 255, 0.12)",
              color: "text.primary",
              "&:hover": { borderColor: "secondary.main", color: "secondary.main" },
            }}
          >
            Add Manual Node
          </Button>

          <Button
            variant="contained"
            size="small"
            startIcon={<AddCircleIcon />}
            onClick={() => setIsGoogleModalOpen(true)}
            sx={{
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "#ffffff",
              fontWeight: 700,
            }}
          >
            Pair Google OAuth
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
        <Chip
          label={`Total Accounts: ${accounts.length}`}
          size="small"
          sx={{
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            color: "text.primary",
            fontFamily: "monospace",
            fontSize: "0.75rem",
          }}
        />
        <Chip
          label={`Active Sandboxes: ${activeCount}`}
          size="small"
          color="success"
          variant="outlined"
          sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}
        />
        {warningCount > 0 && (
          <Chip
            label={`Quota Warnings / Depleted: ${warningCount}`}
            size="small"
            color="warning"
            variant="outlined"
            sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}
          />
        )}
      </Box>

      <Card sx={{ border: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(13, 19, 34, 0.75)", borderRadius: 3 }}>
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
            }}
          >
            <TextField
              size="small"
              placeholder="Search alias, email, container, plan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                width: { xs: "100%", md: 340 },
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "rgba(9, 13, 22, 0.7)",
                  borderRadius: 2,
                  fontSize: "0.8rem",
                },
              }}
            />

            <Box
              sx={{
                display: "flex",
                gap: { xs: 1, sm: 2 },
                width: { xs: "100%", md: "auto" },
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <FormControl size="small" sx={{ minWidth: { xs: 130, sm: 160 }, flex: { xs: 1, sm: "initial" } }}>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <FilterListIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                    </InputAdornment>
                  }
                  sx={{
                    backgroundColor: "rgba(9, 13, 22, 0.7)",
                    borderRadius: 2,
                    fontSize: "0.8rem",
                  }}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                  <MenuItem value="depleted">Depleted</MenuItem>
                  <MenuItem value="paused">Paused</MenuItem>
                </Select>
              </FormControl>

              <ToggleButtonGroup
                size="small"
                value={viewMode}
                exclusive
                onChange={(_, next) => next && setViewMode(next)}
                sx={{
                  backgroundColor: "rgba(9, 13, 22, 0.7)",
                  "& .MuiToggleButton-root": {
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    color: "text.secondary",
                    px: 1.5,
                    "&.Mui-selected": {
                      color: "primary.main",
                      backgroundColor: "rgba(16, 185, 129, 0.12)",
                    },
                  },
                }}
              >
                <ToggleButton value="grid" title="Rich Grid Cards">
                  <GridViewIcon sx={{ fontSize: 18, mr: 0.5 }} />
                  <Typography variant="caption" sx={{ display: { xs: "none", sm: "inline" }, fontWeight: 700 }}>
                    Cards
                  </Typography>
                </ToggleButton>
                <ToggleButton value="list" title="Compact Cards List">
                  <ViewListIcon sx={{ fontSize: 18, mr: 0.5 }} />
                  <Typography variant="caption" sx={{ display: { xs: "none", sm: "inline" }, fontWeight: 700 }}>
                    Compact
                  </Typography>
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {filteredAccounts.length === 0 ? (
        <Card sx={{ p: 6, textAlign: "center", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 3.5 }}>
          <PeopleIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1, opacity: 0.5 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#ffffff" }}>
            No Matching Accounts Found
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Try adjusting your search filter or pair a new Google account
          </Typography>
        </Card>
      ) : viewMode === "grid" ? (
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {filteredAccounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onEdit={(acc) => setEditingAccount(acc)}
              onDelete={(acc) => setDeletingAccount(acc)}
            />
          ))}
        </div>
      ) : (
        
        <div className="flex flex-col gap-3">
          {filteredAccounts.map((account) => (
            <AccountListItemCard
              key={account.id}
              account={account}
              onEdit={(acc) => setEditingAccount(acc)}
              onDelete={(acc) => setDeletingAccount(acc)}
            />
          ))}
        </div>
      )}

      <GooglePairingModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
      />

      <AddManualAccountModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
      />

      <EditAccountModal
        account={editingAccount}
        isOpen={Boolean(editingAccount)}
        onClose={() => setEditingAccount(null)}
      />

      <DeleteConfirmModal
        account={deletingAccount}
        isOpen={Boolean(deletingAccount)}
        onClose={() => setDeletingAccount(null)}
      />
    </Box>
  );
};
