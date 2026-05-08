'use client';

interface LoaderProps {
  hidden: boolean;
}

export default function Loader({ hidden }: LoaderProps) {
  return (
    <div className={`loader${hidden ? ' hidden' : ''}`}>
      <div className="loader-animation" />
    </div>
  );
}
