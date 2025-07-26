import { ActionIcon, AppShellSection, Menu, Stack, Tooltip } from "@mantine/core";
import { type Icon, IconChess, IconCpu, IconDatabase, IconFiles, IconSettings, IconUsers } from "@tabler/icons-react";
import { Link, useMatchRoute } from "@tanstack/react-router";
import cx from "clsx";
import { useTranslation } from "react-i18next";
import * as classes from "./Sidebar.css";

interface NavbarLinkProps {
  icon: Icon;
  label: string;
  url: string;
  active?: boolean;
}

function NavbarLink({ url, icon: Icon, label }: NavbarLinkProps) {
  const matcesRoute = useMatchRoute();
  return (
    <Tooltip label={label} position="right">
      <Link
        to={url}
        className={cx(classes.link, {
          [classes.active]: matcesRoute({ to: url, fuzzy: true }),
        })}
      >
        <Icon size="1.5rem" stroke={1.5} />
      </Link>
    </Tooltip>
  );
}

export const linksdata = [
  { icon: IconChess, label: "Board", url: "/" },
  { icon: IconCpu, label: "Engines", url: "/engines" },
  {
    icon: IconDatabase,
    label: "Databases",
    url: "/databases",
  },
  { icon: IconFiles, label: "Files", url: "/files" },
  { icon: IconUsers, label: "Accounts", url: "/accounts" },
];

export function SideBar() {
  const { t } = useTranslation();

  const links = linksdata.map((link) => <NavbarLink {...link} label={t(`SideBar.${link.label}`)} key={link.label} />);

  return (
    <>
      <AppShellSection grow>
        <Stack justify="center" gap={0}>
          {links}
        </Stack>
      </AppShellSection>
      <AppShellSection>
        <Stack justify="center" gap={0}>
          <Menu position="right-end">
            <Menu.Target>
              <Tooltip label="Manage" position="right" openDelay={1000}>
                <ActionIcon
                  className={cx(classes.link, {
                    // [classes.active]: matcesRoute({ to: url, fuzzy: true }),
                  })}
                >
                  <IconSettings size="1.5rem" stroke={1.5} />
                </ActionIcon>
              </Tooltip>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item component={Link} to="/settings">
                {t("SideBar.Settings")}
              </Menu.Item>
              <Menu.Item component={Link} to="/settings/keyboard-shortcuts">
                {t("SideBar.KeyboardShortcuts")}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Stack>
      </AppShellSection>
    </>
  );
}
