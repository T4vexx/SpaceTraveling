import Link from 'next/link';

import styles from './previewButtom.module.scss';

export default function PreviewButtom(): JSX.Element {
    return (
        <aside className={styles.containerButton}>
            <Link href="/api/exit-preview">
                <a>Sair do modo Preview</a>
            </Link>
        </aside>
    );
}